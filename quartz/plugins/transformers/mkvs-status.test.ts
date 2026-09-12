import test, { describe } from "node:test"
import assert from "node:assert"
import { readFileSync } from "fs"
import { join } from "path"
import { fromHtml } from "hast-util-from-html"
import { visit } from "unist-util-visit"
import type { Element, ElementContent, Root } from "hast"
import { markStatuses, STATUSES } from "./mkvs-status"

// Статусы на титульной странице правятся руками, обычным текстом. Тест держит
// три договорённости: колонка находится по заголовку, опечатка не проходит
// молча, и у каждого статуса из перечня плагина есть свой цвет в стилях.

function table(head: string[], rows: string[][]): Root {
  const th = head.map((cell) => `<th>${cell}</th>`).join("")
  const tr = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
    .join("")
  return fromHtml(`<table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`, {
    fragment: true,
  })
}

function textOf(node: ElementContent): string {
  if (node.type === "text") return node.value
  if (node.type === "element") return node.children.map(textOf).join("")
  return ""
}

function badges(tree: Root): Element[] {
  const found: Element[] = []
  visit(tree, "element", (node: Element) => {
    const classes = node.properties.className
    if (Array.isArray(classes) && classes.includes("mkvs-status")) found.push(node)
  })
  return found
}

describe("markStatuses", () => {
  test("каждый статус из перечня получает плашку своего цвета", () => {
    const entries = [...STATUSES]
    const tree = table(
      ["№", "Тема", "Статус"],
      entries.map(([text], i) => [String(i + 1), "Тема", text]),
    )

    assert.deepStrictEqual(markStatuses(tree), [])
    assert.deepStrictEqual(
      badges(tree).map((badge) => [textOf(badge), badge.properties.dataStatus]),
      entries,
    )
  })

  test("регистр и лишние пробелы не мешают", () => {
    const tree = table(["Статус"], [["  Принимается   с  понижением "]])

    assert.deepStrictEqual(markStatuses(tree), [])
    assert.strictEqual(badges(tree)[0]?.properties.dataStatus, "late")
  })

  test("колонка ищется по заголовку, а не по месту", () => {
    const tree = table(["Статус", "№"], [["принимается", "принимается"]])

    markStatuses(tree)
    assert.strictEqual(badges(tree).length, 1)
  })

  test("таблица без колонки «Статус» не трогается", () => {
    const tree = table(["Режим", "Описание"], [["принимается", "не принимается"]])

    assert.deepStrictEqual(markStatuses(tree), [])
    assert.strictEqual(badges(tree).length, 0)
  })

  test("опечатка и пустая ячейка остаются без плашки и попадают в отчёт", () => {
    const tree = table(
      ["№", "Статус"],
      [
        ["01", "принимаеться"],
        ["02", ""],
        ["03", "не принимается"],
      ],
    )

    assert.deepStrictEqual(markStatuses(tree), ["принимаеться", ""])
    assert.deepStrictEqual(
      badges(tree).map((badge) => badge.properties.dataStatus),
      ["closed"],
    )
  })

  test("разметка внутри ячейки сохраняется в плашке", () => {
    const tree = table(["Статус"], [["<em>не объяснялась</em>"]])

    markStatuses(tree)
    const [badge] = badges(tree)
    assert.ok(badge)
    assert.strictEqual(badge.properties.dataStatus, "pending")
    assert.strictEqual((badge.children[0] as Element).tagName, "em")
  })
})

describe("_status.scss", () => {
  test("у каждого статуса из перечня есть свой цвет", () => {
    const styles = readFileSync(
      join(process.cwd(), "quartz", "styles", "mkvs", "_status.scss"),
      "utf8",
    )
    for (const status of STATUSES.values()) {
      assert.ok(
        styles.includes(`[data-status="${status}"]`),
        `в _status.scss нет цвета для data-status="${status}"`,
      )
    }
  })
})
