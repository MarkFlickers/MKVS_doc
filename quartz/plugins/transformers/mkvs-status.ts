import { visit } from "unist-util-visit"
import type { Root, Element, ElementContent } from "hast"
import type { VFile } from "vfile"
import type { QuartzTransformerPlugin } from "../types"

// Статус приёма лабораторной работы — цветная плашка в колонке «Статус»
// таблицы работ на титульной странице.
//
// В markdown статус записан обычным текстом:
//
//   | № | Тема | Статус |
//   | --- | --- | --- |
//   | 01 | [[lab01/index\|…]] | принимается |
//
// Плагин находит колонку по заголовку «Статус», а не по номеру, и оборачивает
// текст каждой её ячейки в <span class="mkvs-status" data-status="…">. Цвет
// плашки задаёт styles/mkvs/_status.scss. Так таблица правится как обычный
// текст, без сырого HTML, а перечень статусов записан в одном месте — ниже.
//
// Статус не из перечня (скажем, опечатка «принимаеться») остаётся в ячейке как
// есть, без цвета, и сборка выводит предупреждение [mkvs]. Иначе ошибку
// первыми увидели бы студенты.

const STATUS_COLUMN = "статус"

// Текст ячейки -> значение data-status. Сравнение без учёта регистра и с
// точностью до пробелов. Новый статус нужно добавить и сюда, и цветом в
// _status.scss — второе проверяет mkvs-status.test.ts.
export const STATUSES: ReadonlyMap<string, string> = new Map([
  ["не объяснялась", "pending"],
  ["принимается", "open"],
  ["принимается с понижением", "late"],
  ["не принимается", "closed"],
])

function squash(text: string): string {
  return text.replace(/\s+/g, " ").trim()
}

function textOf(node: ElementContent): string {
  if (node.type === "text") return node.value
  if (node.type === "element") return node.children.map(textOf).join("")
  return ""
}

function childrenNamed(node: Element, tagName: string): Element[] {
  return node.children.filter(
    (child): child is Element => child.type === "element" && child.tagName === tagName,
  )
}

// Размечает статусы во всех таблицах с колонкой «Статус». Возвращает тексты
// ячеек, которые распознать не удалось, — для предупреждения.
export function markStatuses(tree: Root): string[] {
  const unknown: string[] = []

  visit(tree, "element", (table: Element) => {
    if (table.tagName !== "table") return

    const head = childrenNamed(table, "thead")[0]
    const headRow = head && childrenNamed(head, "tr")[0]
    if (!headRow) return

    const column = childrenNamed(headRow, "th").findIndex(
      (th) => squash(textOf(th)).toLowerCase() === STATUS_COLUMN,
    )
    if (column === -1) return

    for (const body of childrenNamed(table, "tbody")) {
      for (const row of childrenNamed(body, "tr")) {
        const cell = childrenNamed(row, "td")[column]
        if (!cell) continue

        const text = squash(textOf(cell))
        const status = STATUSES.get(text.toLowerCase())
        if (!status) {
          unknown.push(text)
          continue
        }

        // Содержимое ячейки переезжает в плашку целиком, а не заменяется
        // текстом: написанное в ней (регистр, выделение) остаётся как есть.
        cell.children = [
          {
            type: "element",
            tagName: "span",
            properties: { className: ["mkvs-status"], dataStatus: status },
            children: cell.children,
          },
        ]
      }
    }
  })

  return unknown
}

export const MkvsStatus: QuartzTransformerPlugin = () => ({
  name: "MkvsStatus",
  htmlPlugins() {
    return [
      () => (tree: Root, file: VFile) => {
        for (const text of markStatuses(tree)) {
          console.warn(
            `[mkvs] ${file.data.slug}: в колонке «Статус» стоит «${text}», а такого ` +
              "статуса нет — ячейка останется без цвета. Допустимые статусы: " +
              [...STATUSES.keys()].map((status) => `«${status}»`).join(", ") +
              " (plugins/transformers/mkvs-status.ts).",
          )
        }
      },
    ]
  },
})
