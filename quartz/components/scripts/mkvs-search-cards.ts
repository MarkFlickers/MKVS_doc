import { matcher } from "./mkvs-search-query"
import { countIn, textsFor } from "./mkvs-search-matches"
import { pagePath } from "./mkvs-path"

// ---------------------------------------------------------------------------
// Карточка результата: путь и число совпадений
// ---------------------------------------------------------------------------

function plural(count: number): string {
  const tens = count % 100
  const ones = count % 10
  if (tens >= 11 && tens <= 14) return "совпадений"
  if (ones === 1) return "совпадение"
  if (ones >= 2 && ones <= 4) return "совпадения"
  return "совпадений"
}

// Путь строится общей функцией: тот же путь стоит над названием в кнопках
// «Предыдущее/Следующее» (MkvsPrevNext.tsx).
async function pathOf(slug: string): Promise<string> {
  const index = await fetchData
  const titles = index as unknown as Record<string, { title?: string } | undefined>
  return pagePath(slug, (parent) => titles[parent]?.title)
}

export function decorateCards(container: HTMLElement, term: string) {
  const regex = matcher(term)

  for (const card of container.querySelectorAll<HTMLAnchorElement>(".result-card")) {
    if (card.classList.contains("no-match")) continue
    // Плагин пересобирает карточки на каждое нажатие клавиши, но наблюдатель
    // может сработать на одну пересборку несколько раз.
    if (card.dataset.mkvsTerm === term) continue
    card.dataset.mkvsTerm = term

    const meta = document.createElement("div")
    meta.className = "mkvs-result-meta"

    const path = document.createElement("span")
    path.className = "mkvs-result-path"
    meta.appendChild(path)

    const count = document.createElement("span")
    count.className = "mkvs-result-count"
    meta.appendChild(count)

    card.insertBefore(meta, card.firstChild)

    const slug = card.id
    void pathOf(slug).then((value) => {
      if (!path.isConnected || !value) return
      path.textContent = value
      // Длинные названия работ обрезаются многоточием — целиком их показывает
      // всплывающая подсказка браузера.
      path.title = value
    })

    if (!regex) continue
    void textsFor(card.href).then((texts) => {
      if (!count.isConnected || card.dataset.mkvsTerm !== term) return
      const found = countIn(texts, regex)
      // Ноль совпадений в тексте — значит, нашлось только в заголовке или в
      // теге. Числа в этом случае нет, чтобы не спорить с подсветкой.
      if (found === 0) return
      count.textContent = `${found} ${plural(found)}`
    })
  }
}
