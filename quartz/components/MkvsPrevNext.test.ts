import test, { describe } from "node:test"
import assert from "node:assert"
import { Explorer } from "@quartz-community/explorer"
import { FileTrieNode } from "../util/fileTrie"
import type { BuildTimeTrieData } from "../util/ctx"
import type { QuartzPluginData } from "../plugins/vfile"
import { buildChain, compareNodes } from "./MkvsPrevNext"

// Кнопки «Предыдущее/Следующее» обязаны идти в том же порядке, в каком строки
// стоят в Проводнике: читатель видит дерево слева и ждёт от кнопок того же
// порядка. Порядок задаётся сортировкой узлов, и MkvsPrevNext.tsx держит её
// РУЧНУЮ КОПИЮ — плагин свою sortFn по умолчанию не экспортирует.
//
// Копия — единственное место, где расхождение с плагином не даёт ни ошибки
// сборки, ни предупреждения: порядок просто молча разошёлся бы. Поэтому здесь
// он проверяется дважды:
//
//   1) против настоящей sortFn плагина — её исходник плагин сам кладёт в
//      атрибут data-data-fns разметки Проводника, оттуда её и берём;
//   2) против правил, записанных словами, — на случай, если плагин перестанет
//      отдавать функцию таким способом и проверка (1) окажется нечего сверять.

// Достаёт sortFn, которой Проводник реально сортирует дерево в браузере.
// Плагин сериализует её в data-data-fns при отрисовке компонента, а инлайн-
// скрипт на странице поднимает её оттуда через new Function — здесь делается
// ровно то же самое.
function explorerSortFn(): ((a: unknown, b: unknown) => number) | null {
  try {
    const component = (Explorer as (opts?: unknown) => unknown)({}) as (props: unknown) => {
      props: Record<string, string>
    }
    const vnode = component({ cfg: { locale: "ru-RU" } })
    const source = JSON.parse(vnode.props["data-data-fns"]).sortFn
    if (typeof source !== "string" || source.length === 0) return null
    return new Function("a", "b", `return (${source})(a, b)`) as (a: unknown, b: unknown) => number
  } catch {
    return null
  }
}

// Узлу сортировки нужны только два поля, поэтому полноценное дерево строить
// незачем.
function node(displayName: string, isFolder: boolean) {
  return { displayName, isFolder } as unknown as FileTrieNode<BuildTimeTrieData>
}

// Имена нарочно разные: «числовые» (2 против 10), буквенные, с регистром, с
// кириллицей, пустые — расхождение в любом из правил должно всплыть.
const NAMES = [
  "01-main",
  "02-task-1",
  "10-appendix",
  "2-second",
  "Лабораторная работа 02",
  "лабораторная работа 10",
  "Глоссарий",
  "docs",
  "",
]

function samples(): FileTrieNode<BuildTimeTrieData>[] {
  const result: FileTrieNode<BuildTimeTrieData>[] = []
  for (const name of NAMES) {
    result.push(node(name, false))
    result.push(node(name, true))
  }
  return result
}

describe("compareNodes", () => {
  test("совпадает с sortFn, которой сортирует сам Проводник", () => {
    const pluginSort = explorerSortFn()
    // Плагин перестал отдавать sortFn в разметке — значит проверять здесь
    // нечего, и расхождение ловят правила ниже. Тест не «зеленеет» молча:
    // такой случай — сам по себе повод заглянуть в плагин.
    assert.ok(
      pluginSort,
      "Не удалось достать sortFn из разметки Проводника (data-data-fns). " +
        "Плагин @quartz-community/explorer изменил способ передачи функций — " +
        "сверьте compareNodes в MkvsPrevNext.tsx с его новой сортировкой вручную.",
    )

    const nodes = samples()
    for (const a of nodes) {
      for (const b of nodes) {
        assert.strictEqual(
          Math.sign(compareNodes(a, b)),
          Math.sign(pluginSort(a, b)),
          `Порядок разошёлся: ${a.isFolder ? "папка" : "файл"} «${a.displayName}» против ` +
            `${b.isFolder ? "папки" : "файла"} «${b.displayName}»`,
        )
      }
    }
  })

  test("папки идут выше файлов", () => {
    assert.ok(compareNodes(node("яяя", true), node("ааа", false)) < 0)
    assert.ok(compareNodes(node("ааа", false), node("яяя", true)) > 0)
  })

  test("числа сравниваются по значению: «2.» раньше «10.»", () => {
    assert.ok(compareNodes(node("2. Второе", false), node("10. Десятое", false)) < 0)
    assert.ok(compareNodes(node("02-task", false), node("10-appendix", false)) < 0)
  })

  test("регистр на порядок не влияет", () => {
    assert.strictEqual(compareNodes(node("Работа", false), node("работа", false)), 0)
  })
})

// --- цепочка страниц --------------------------------------------------------

function file(slug: string, title: string): QuartzPluginData {
  return {
    slug,
    filePath: `content/${slug}.md`,
    frontmatter: { title, tags: [] },
  } as unknown as QuartzPluginData
}

// Та же цепочка, но собранная настоящей sortFn Проводника. Если плагин
// изменит сортировку, buildChain разойдётся с этим порядком.
function chainByExplorerOrder(files: QuartzPluginData[]): string[] {
  const pluginSort = explorerSortFn()
  assert.ok(pluginSort, "sortFn Проводника недоступна")

  const trie = new FileTrieNode<BuildTimeTrieData>([])
  for (const item of files) {
    if (!item.frontmatter || !item.slug || !item.filePath) continue
    trie.add({
      ...item,
      slug: item.slug,
      title: item.frontmatter.title,
      filePath: item.filePath,
    })
  }
  trie.filter((n) => {
    if (n.slugSegment === "tags") return false
    const slug = n.data?.slug
    return !(slug?.startsWith("glossary/") && slug !== "glossary/index")
  })
  trie.sort(
    pluginSort as (
      a: FileTrieNode<BuildTimeTrieData>,
      b: FileTrieNode<BuildTimeTrieData>,
    ) => number,
  )

  return trie
    .entries()
    .filter(([, n]) => n.data !== null)
    .map(([, n]) => n.data!.slug)
}

const CONTENT: QuartzPluginData[] = [
  file("index", "Микроконтроллеры и встраиваемые системы"),
  file("lab01/index", "Лабораторная работа 01"),
  // Номера в заголовках, а не в именах файлов, — сортируется именно
  // displayName, то есть title из frontmatter (как в настоящем контенте).
  file("lab01/01-main", "1. Основная часть"),
  file("lab01/02-task-1", "2. Практическое задание №1"),
  file("lab01/10-extra", "10. Дополнение"),
  file("lab02/index", "Лабораторная работа 02"),
  file("lab02/01-theory", "1. Теоретический материал"),
  file("lab02/02-main", "2. Основная часть"),
  file("glossary/index", "Глоссарий"),
  file("glossary/gpio", "GPIO"),
  file("glossary/cmsis", "CMSIS"),
  file("docs/index", "Документация"),
]

// Цепочка одними slug'ами: FullSlug — брендированный тип, и сравнивать его
// со строковыми литералами напрямую нельзя.
function chainSlugs(files: QuartzPluginData[]): string[] {
  return buildChain(files).map((entry) => entry.slug as string)
}

describe("buildChain", () => {
  test("порядок совпадает с порядком строк в Проводнике", () => {
    const ours = chainSlugs(CONTENT)
    assert.deepStrictEqual(ours, chainByExplorerOrder(CONTENT))
  })

  test("статьи глоссария в цепочку не входят, а указатель входит", () => {
    const slugs = chainSlugs(CONTENT)
    assert.ok(slugs.includes("glossary/index"))
    assert.ok(!slugs.includes("glossary/gpio"))
    assert.ok(!slugs.includes("glossary/cmsis"))
  })

  test("«10.» идёт после «2.», а не между «1.» и «2.»", () => {
    const slugs = chainSlugs(CONTENT)
    const at = (slug: string) => slugs.indexOf(slug)
    assert.ok(at("lab01/01-main") < at("lab01/02-task-1"))
    assert.ok(at("lab01/02-task-1") < at("lab01/10-extra"))
  })

  test("виртуальные страницы без filePath пропускаются", () => {
    const withVirtual = [
      ...CONTENT,
      { slug: "tags/platformio", frontmatter: { title: "platformio" } } as QuartzPluginData,
    ]
    const slugs = chainSlugs(withVirtual)
    assert.ok(!slugs.some((slug) => slug.startsWith("tags/")))
  })
})
