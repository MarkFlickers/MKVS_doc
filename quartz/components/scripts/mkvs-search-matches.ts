// ---------------------------------------------------------------------------
// Совпадения в тексте страницы
// ---------------------------------------------------------------------------

// Подсказки-выноски (глоссарий, штатные popover'ы Quartz) вешаются в
// document.body, но всплывающее окно самого Quartz исторически кладут внутрь
// ссылки. Такой текст в странице не виден, а нумерацию совпадений сдвинул бы.
const OVERLAYS = ".popover, .glossary-popover, .glossary-hint"

function textNodes(doc: Document): Text[] {
  const nodes: Text[] = []
  // Тот же набор контейнеров, который берёт превью поиска: шапка страницы
  // («хлебные крошки» и заголовок) и сама статья.
  for (const hint of doc.querySelectorAll<HTMLElement>(".popover-hint")) {
    const walker = doc.createTreeWalker(hint, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) =>
        node.parentElement?.closest(OVERLAYS) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    })
    let node = walker.nextNode()
    while (node) {
      nodes.push(node as Text)
      node = walker.nextNode()
    }
  }
  return nodes
}

export function countIn(texts: string[], regex: RegExp): number {
  let count = 0
  for (const text of texts) {
    regex.lastIndex = 0
    while (regex.exec(text) !== null) count++
  }
  return count
}

export type Match = { node: Text; start: number; end: number }

// Совпадения в порядке документа. Плагин подсвечивает превью так же —
// текстовый узел за текстовым узлом, — поэтому N-е совпадение здесь и N-я
// подсветка в превью указывают на одно и то же место.
export function findMatches(doc: Document, regex: RegExp): Match[] {
  const matches: Match[] = []
  for (const node of textNodes(doc)) {
    const value = node.nodeValue ?? ""
    regex.lastIndex = 0
    let found: RegExpExecArray | null
    while ((found = regex.exec(value)) !== null) {
      matches.push({ node, start: found.index, end: found.index + found[0].length })
      if (found[0].length === 0) regex.lastIndex++
    }
  }
  return matches
}

// ---------------------------------------------------------------------------
// Загрузка страниц результатов
// ---------------------------------------------------------------------------

// Число совпадений считается по той же разметке, которую показывает превью, —
// иначе счётчик в карточке разошёлся бы с панелью «‹ 3 / 12 ›». Плагин эти же
// страницы грузит для превью, так что второй раз их отдаёт кэш браузера.
// Здесь хранится не документ, а только текст: страниц много, а нужен от них
// один список текстовых узлов.
const pages = new Map<string, Promise<string[]>>()
const parser = new DOMParser()

export function textsFor(href: string): Promise<string[]> {
  let texts = pages.get(href)
  if (!texts) {
    texts = fetch(href)
      .then((response) => (response.ok ? response.text() : ""))
      .then((html) => {
        const doc = parser.parseFromString(html, "text/html")
        return textNodes(doc).map((node) => node.nodeValue ?? "")
      })
      .catch(() => [])
    pages.set(href, texts)
  }
  return texts
}
