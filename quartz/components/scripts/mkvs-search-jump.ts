import { matcher, termOf } from "./mkvs-search-query"
import { findMatches } from "./mkvs-search-matches"
import { previewState } from "./mkvs-search-preview"

// ---------------------------------------------------------------------------
// Переход: запоминаем активное совпадение
// ---------------------------------------------------------------------------

const JUMP_KEY = "mkvs-search-jump"

export type Jump = { slug: string; term: string; index: number; time: number }

export function remember(card: HTMLAnchorElement, input: HTMLInputElement) {
  const term = termOf(input)
  if (!term) return

  const layout = card.closest<HTMLElement>(".search-layout")
  const state = layout ? previewState(layout) : undefined
  // Превью показывает ту карточку, что сейчас выделена. Если открывают
  // другую (мышь ушла на соседнюю строку быстрее, чем перерисовалось окно),
  // номер совпадения не годится — берём первое.
  const index = state && state.slug === card.id ? state.index : 0

  const jump: Jump = { slug: card.id, term, index, time: Date.now() }
  try {
    sessionStorage.setItem(JUMP_KEY, JSON.stringify(jump))
  } catch {
    // Приватный режим браузера — переход просто останется штатным.
  }
}

export function takeJump(): Jump | null {
  let raw: string | null = null
  try {
    raw = sessionStorage.getItem(JUMP_KEY)
    sessionStorage.removeItem(JUMP_KEY)
  } catch {
    return null
  }
  if (!raw) return null

  try {
    const jump = JSON.parse(raw) as Jump
    // Запись живёт ровно один переход. Задержка больше минуты означает, что
    // страница так и не открылась (например, ссылку открыли в другой вкладке).
    if (!jump.term || Date.now() - jump.time > 60_000) return null
    if (jump.slug !== document.body.dataset.slug) return null
    return jump
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Переход: подсветка нужного совпадения на открытой странице
// ---------------------------------------------------------------------------

function unwrap(span: HTMLElement) {
  const parent = span.parentNode
  if (!parent) return
  parent.replaceChild(document.createTextNode(span.textContent ?? ""), span)
  parent.normalize()
}

export function applyJump(jump: Jump) {
  // Подстраховка: если плагин всё-таки успел подсветить своё вхождение (его
  // обработчик перестроят, ключ появится другим путём), снимаем подсветку до
  // поиска совпадений — она разрезает текстовый узел и сдвинула бы нумерацию.
  for (const stale of document.querySelectorAll<HTMLElement>(".search-scroll-target")) {
    unwrap(stale)
  }

  const regex = matcher(jump.term)
  if (!regex) return

  const matches = findMatches(document, regex)
  if (matches.length === 0) return

  const match = matches[Math.min(jump.index, matches.length - 1)]
  const range = document.createRange()
  range.setStart(match.node, match.start)
  range.setEnd(match.node, match.end)

  // Класс штатный: оформление и затухание уже описаны в CSS плагина.
  const target = document.createElement("span")
  target.className = "search-scroll-target"
  try {
    range.surroundContents(target)
  } catch {
    return
  }
  target.scrollIntoView({ block: "center" })

  // Картинки пособия догружаются после перехода и сдвигают текст под собой.
  // Пока читатель не тронул страницу сам, держим совпадение по центру.
  let following = true
  const stop = () => {
    following = false
  }
  const onLoad = () => {
    if (following) target.scrollIntoView({ block: "center" })
  }
  document.addEventListener("load", onLoad, true)
  window.addEventListener("wheel", stop, { passive: true })
  window.addEventListener("touchmove", stop, { passive: true })

  const fade = window.setTimeout(() => target.classList.add("fade-out"), 2000)
  const clear = window.setTimeout(() => {
    stop()
    unwrap(target)
  }, 3000)

  window.addCleanup(() => {
    window.clearTimeout(fade)
    window.clearTimeout(clear)
    document.removeEventListener("load", onLoad, true)
    window.removeEventListener("wheel", stop)
    window.removeEventListener("touchmove", stop)
  })
}
