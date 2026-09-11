import { FileTrieNode } from "../util/fileTrie"
import type { BuildTimeTrieData } from "../util/ctx"
import type { QuartzPluginData } from "../plugins/vfile"
import { resolveRelative, type FullSlug } from "../util/path"
import type { QuartzComponent, QuartzComponentProps } from "./types"

// Кнопки «Предыдущее» и «Следующее» под текстом страницы.
//
// Пособие читают подряд, а штатной навигации «вперёд/назад» в Quartz нет:
// перейти к следующему разделу можно только через Проводник слева, а на
// телефоне он ещё и свёрнут в верхнюю панель. Кнопки внизу страницы убирают
// этот лишний шаг: дочитал раздел — сразу перешёл к следующему.
//
// Порядок страниц берётся ТОТ ЖЕ, что рисует Проводник: обход его дерева
// сверху вниз. Другой порядок противоречил бы тому, что читатель видит слева,
// поэтому дерево здесь строится теми же средствами (FileTrieNode) и
// сортируется той же функцией, что стоит по умолчанию в
// @quartz-community/explorer: папки выше файлов, внутри группы — по названию
// с «числовым» сравнением, чтобы «2.» шло перед «10.».
//
// Единственное отличие от дерева — статьи глоссария (см. GLOSSARY_PREFIX
// ниже): их полсотни, и по алфавиту они встают между титульной страницей и
// работами. Идти по ним подряд незачем — в статью приходят по ссылке из
// текста и возвращаются кнопкой «Назад к тексту» (MkvsGlossaryBack.tsx).
// Поэтому в цепочке остаётся только сам указатель терминов, а на самих
// статьях кнопок нет.
//
// Компонент серверный: цепочка известна во время сборки, поэтому ссылки уже
// стоят в HTML и работают без JavaScript.

const PREV_LABEL = "Предыдущее"
const NEXT_LABEL = "Следующее"

// Указатель терминов остаётся в цепочке, статьи под ним — нет.
const GLOSSARY_PREFIX = "glossary/"
const GLOSSARY_INDEX = "glossary/index"

export interface ChainEntry {
  slug: FullSlug
  title: string
}

// Сортировка узлов дерева — копия sortFn по умолчанию из
// @quartz-community/explorer (node_modules/.../explorer/dist/index.js).
//
// Копия, а не импорт: плагин свои defaultOptions не экспортирует. Чтобы
// расхождение не осталось незамеченным, MkvsPrevNext.test.ts достаёт
// настоящую sortFn из разметки Проводника (плагин кладёт её исходник
// в data-data-fns) и сверяет с этой.
export function compareNodes(
  a: FileTrieNode<BuildTimeTrieData>,
  b: FileTrieNode<BuildTimeTrieData>,
): number {
  if (a.isFolder === b.isFolder) {
    return (a.displayName || "").localeCompare(b.displayName || "", undefined, {
      numeric: true,
      sensitivity: "base",
    })
  }
  return a.isFolder ? -1 : 1
}

export function buildChain(allFiles: QuartzPluginData[]): ChainEntry[] {
  const trie = new FileTrieNode<BuildTimeTrieData>([])
  for (const file of allFiles) {
    // filePath нет у виртуальных страниц (страницы тегов, 404): их порождает
    // диспетчер уже после чтения content, см. plugins/pageTypes/dispatcher.ts.
    // В цепочке чтения им не место, а FileTrieNode.insert на таком файле ещё и
    // споткнулся бы о filePath.split("/").
    if (!file.frontmatter || !file.slug || !file.filePath) continue
    trie.add({
      ...file,
      slug: file.slug,
      title: file.frontmatter.title,
      filePath: file.filePath,
    })
  }

  trie.filter((node) => {
    if (node.slugSegment === "tags") return false
    const slug = node.data?.slug
    return !(slug?.startsWith(GLOSSARY_PREFIX) && slug !== GLOSSARY_INDEX)
  })
  trie.sort(compareNodes)

  // entries() обходит дерево сверху вниз: сначала сам узел, затем его потомки —
  // то есть ровно в том порядке, в каком строки идут в Проводнике. Узлы без
  // data — это папки без index.md: открывать в них нечего, в цепочку не идут.
  return trie
    .entries()
    .filter(([, node]) => node.data !== null)
    .map(([, node]) => ({ slug: node.data!.slug as FullSlug, title: node.displayName }))
}

// Цепочка одинакова для всех страниц одной сборки, поэтому считается один раз.
// Ключ — идентификатор сборки: при пересборке в режиме --watch он меняется, и
// цепочка собирается заново (см. buildId в quartz/build.ts).
let cache: { buildId: string; chain: ChainEntry[] } | null = null

function chainFor(buildId: string, allFiles: QuartzPluginData[]): ChainEntry[] {
  if (cache?.buildId !== buildId) {
    cache = { buildId, chain: buildChain(allFiles) }
  }
  return cache.chain
}

function Arrow({ back }: { back: boolean }) {
  return (
    <svg
      class="mkvs-prevnext-arrow"
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d={back ? "m15 5-7 7 7 7" : "m9 5 7 7-7 7"} />
    </svg>
  )
}

const PrevNext: QuartzComponent = ({ ctx, fileData, allFiles }: QuartzComponentProps) => {
  const slug = fileData.slug
  if (!slug) return null

  const chain = chainFor(ctx.buildId, allFiles)
  const index = chain.findIndex((entry) => entry.slug === slug)
  // Страницы вне цепочки — статьи глоссария, страницы тегов, 404: соседей у
  // них нет, кнопки не выводятся.
  if (index === -1) return null

  const prev = chain[index - 1]
  const next = chain[index + 1]
  if (!prev && !next) return null

  return (
    <nav class="mkvs-prevnext" aria-label="Соседние страницы">
      {prev && (
        <a class="mkvs-prevnext-item mkvs-prevnext-prev" href={resolveRelative(slug, prev.slug)}>
          <Arrow back={true} />
          <span class="mkvs-prevnext-text">
            <span class="mkvs-prevnext-label">{PREV_LABEL}</span>
            <span class="mkvs-prevnext-title">{prev.title}</span>
          </span>
        </a>
      )}
      {next && (
        <a class="mkvs-prevnext-item mkvs-prevnext-next" href={resolveRelative(slug, next.slug)}>
          <span class="mkvs-prevnext-text">
            <span class="mkvs-prevnext-label">{NEXT_LABEL}</span>
            <span class="mkvs-prevnext-title">{next.title}</span>
          </span>
          <Arrow back={false} />
        </a>
      )}
    </nav>
  )
}

PrevNext.displayName = "MkvsPrevNext"
export default PrevNext
