import test, { describe } from "node:test"
import assert from "node:assert"
import { FileTrieNode } from "../util/fileTrie"
import type { BuildTimeTrieData } from "../util/ctx"
import { listingEntries } from "./MkvsFolderContent"

// Список разделов под текстом работы обязан идти в порядке Проводника, а не в
// порядке дат изменения файлов, как у штатного списка folder-page. Сама
// сортировка сверяется с Проводником в MkvsPrevNext.test.ts; здесь — что список
// строится именно ею и что даты на него не влияют.

interface Page {
  slug: string
  title: string
  modified?: string
  unlisted?: boolean
}

function trieOf(pages: Page[]): FileTrieNode<BuildTimeTrieData> {
  const trie = new FileTrieNode<BuildTimeTrieData>([])
  for (const page of pages) {
    const date = new Date(page.modified ?? "2026-01-01")
    trie.add({
      slug: page.slug,
      title: page.title,
      filePath: `content/${page.slug}.md`,
      unlisted: page.unlisted,
      dates: { created: date, modified: date, published: date },
    } as unknown as BuildTimeTrieData)
  }
  return trie
}

function listing(pages: Page[], folder: string) {
  const node = trieOf(pages).findNode(folder.split("/"))
  assert.ok(node, `нет папки ${folder}`)
  return listingEntries(node)
}

describe("listingEntries", () => {
  // Даты нарочно в обратном порядке: по ним разделы встали бы «10, 2, 1».
  const LAB = [
    { slug: "lab02/index", title: "Лабораторная работа 02" },
    { slug: "lab02/02-main", title: "2. Основная часть", modified: "2026-09-11" },
    { slug: "lab02/10-appendix", title: "10. Приложение", modified: "2026-09-12" },
    { slug: "lab02/01-theory", title: "1. Теоретический материал", modified: "2026-09-10" },
  ]

  test("разделы идут по номеру в названии, а не по дате изменения", () => {
    assert.deepStrictEqual(
      listing(LAB, "lab02/index").map((entry) => entry.title),
      ["1. Теоретический материал", "2. Основная часть", "10. Приложение"],
    )
  })

  test("ссылки ведут на сами страницы", () => {
    assert.deepStrictEqual(
      listing(LAB, "lab02/index").map((entry) => entry.slug),
      ["lab02/01-theory", "lab02/02-main", "lab02/10-appendix"],
    )
  })

  test("страницы с unlisted: true в список не попадают", () => {
    const pages = [...LAB, { slug: "lab02/03-draft", title: "3. Черновик", unlisted: true }]
    assert.ok(!listing(pages, "lab02/index").some((entry) => entry.title === "3. Черновик"))
  })

  test("подпапка идёт выше страниц и ведёт на свой index", () => {
    const pages = [...LAB, { slug: "lab02/extra/index", title: "Дополнительно" }]
    const first = listing(pages, "lab02/index")[0]
    assert.deepStrictEqual(first, { slug: "lab02/extra/index", title: "Дополнительно" })
  })
})
