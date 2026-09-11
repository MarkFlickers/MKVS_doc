import { termOf } from "./mkvs-search-query"

// ---------------------------------------------------------------------------
// Превью: панель «‹ 3 / 12 ›»
// ---------------------------------------------------------------------------

export type Preview = { slug: string; matches: HTMLElement[]; index: number }

const previews = new WeakMap<HTMLElement, Preview>()

// Состояние превью нужно ещё и при переходе (mkvs-search-jump.ts): в момент
// щелчка по карточке запоминается номер активного совпадения. Сама карта
// наружу не выдаётся: менять состояние извне нельзя.
export function previewState(layout: HTMLElement): Preview | undefined {
  return previews.get(layout)
}

// Совпадение, выбранное читателем вручную, — по одному на страницу. Превью
// пересобирается всякий раз, когда выделение в списке уходит на другую
// карточку и возвращается обратно, и без этой памяти оно каждый раз
// открывалось бы на первом совпадении. Запрос хранится рядом: сменился он —
// сменился и набор совпадений, и старый номер ничего не значит.
const chosen = new Map<string, { term: string; index: number }>()

function inputOf(layout: HTMLElement): HTMLInputElement | null {
  return layout.closest(".search")?.querySelector<HTMLInputElement>(".search-bar") ?? null
}

const CHEVRON_UP = "m5 15 7-7 7 7"
const CHEVRON_DOWN = "m5 9 7 7 7-7"

function chevron(path: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" ` +
    `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ` +
    `stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`
  )
}

// Панель — не <div>: CSS плагина обращается к колонкам превью через
// `.search-layout > div:first-child` и `> div:last-child`, и лишний div в
// разметке отобрал бы у превью его правила.
function buildBar(layout: HTMLElement): HTMLElement {
  const existing = layout.querySelector<HTMLElement>(".mkvs-match-bar")
  if (existing) return existing

  const bar = document.createElement("aside")
  bar.className = "mkvs-match-bar"
  bar.hidden = true

  const prev = document.createElement("button")
  prev.type = "button"
  prev.className = "mkvs-match-step mkvs-match-prev"
  prev.title = "Предыдущее совпадение (Alt + ↑)"
  prev.setAttribute("aria-label", prev.title)
  prev.innerHTML = chevron(CHEVRON_UP)

  const label = document.createElement("span")
  label.className = "mkvs-match-count"
  label.setAttribute("aria-live", "polite")

  const next = document.createElement("button")
  next.type = "button"
  next.className = "mkvs-match-step mkvs-match-next"
  next.title = "Следующее совпадение (Alt + ↓)"
  next.setAttribute("aria-label", next.title)
  next.innerHTML = chevron(CHEVRON_DOWN)

  bar.append(prev, label, next)
  layout.appendChild(bar)
  return bar
}

function center(container: HTMLElement, target: HTMLElement) {
  // Считаем через getBoundingClientRect, а не через offsetTop: результат не
  // зависит от того, какие предки позиционированы. (Сам плагин суммирует
  // offsetTop по цепочке offsetParent и промахивается — правило
  // position: relative в styles/mkvs/_search.scss лечит его арифметику.)
  const box = container.getBoundingClientRect()
  const mark = target.getBoundingClientRect()
  const delta = mark.top - box.top - (box.height - mark.height) / 2
  container.scrollTop = Math.max(0, container.scrollTop + delta)
}

function showMatch(layout: HTMLElement, index: number, scroll: boolean) {
  const state = previews.get(layout)
  const bar = layout.querySelector<HTMLElement>(".mkvs-match-bar")
  const container = layout.querySelector<HTMLElement>(".preview-container")
  if (!state || !bar || !container) return

  const total = state.matches.length
  bar.hidden = total === 0
  if (total === 0) return

  state.index = Math.min(Math.max(index, 0), total - 1)

  for (const mark of state.matches) mark.classList.remove("mkvs-match-active")
  const target = state.matches[state.index]
  target.classList.add("mkvs-match-active")

  const label = bar.querySelector<HTMLElement>(".mkvs-match-count")
  if (label) {
    label.textContent = `${state.index + 1} / ${total}`
    label.setAttribute("aria-label", `Совпадение ${state.index + 1} из ${total}`)
  }

  if (scroll) center(container, target)
}

// Выбор читателя: тот же переход к совпадению, но с запоминанием. Всё, что
// делается «само» (первый показ превью, восстановление после пересборки),
// идёт мимо — иначе память о выборе перезаписывалась бы служебными вызовами.
function choose(layout: HTMLElement, index: number, scroll: boolean) {
  showMatch(layout, index, scroll)

  const state = previews.get(layout)
  const input = inputOf(layout)
  if (!state || !state.slug || !input) return
  chosen.set(state.slug, { term: termOf(input), index: state.index })
}

// Перебор идёт по кругу: с последнего совпадения вперёд — на первое, с
// первого назад — на последнее.
export function step(layout: HTMLElement, delta: number) {
  const state = previews.get(layout)
  if (!state) return
  const total = state.matches.length
  if (total === 0) return
  choose(layout, (state.index + delta + total) % total, true)
}

function rebuild(layout: HTMLElement) {
  const container = layout.querySelector<HTMLElement>(".preview-container")
  const bar = layout.querySelector<HTMLElement>(".mkvs-match-bar")
  if (!container || !bar) return

  const matches = Array.from(container.querySelectorAll<HTMLElement>(".highlight"))
  const focused = layout.querySelector<HTMLElement>(".result-card.focus")
  previews.set(layout, { slug: focused?.id ?? "", matches, index: 0 })

  if (matches.length === 0) {
    bar.hidden = true
    return
  }

  // Стартовое совпадение — самое длинное, как и у плагина: для запроса из
  // нескольких слов это фраза целиком, а не первое попавшееся слово. Для
  // запроса из одного слова все совпадения одной длины, и это просто первое.
  let start = 0
  for (let i = 1; i < matches.length; i++) {
    if (matches[i].textContent!.length > matches[start].textContent!.length) start = i
  }

  // Но если по этой странице читатель уже выбирал совпадение сам, возвращаемся
  // к его выбору, а не к началу.
  const input = inputOf(layout)
  const saved = chosen.get(focused?.id ?? "")
  if (input && saved && saved.term === termOf(input) && saved.index < matches.length) {
    start = saved.index
  }

  showMatch(layout, start, true)
}

export function installPreview(layout: HTMLElement) {
  const bar = buildBar(layout)

  // Прокрутку, которую сделали сами, отличаем от пользовательской по позиции:
  // событие scroll приходит асинхронно, и флагом это не поймать.
  let userScrolled = false
  let pending: number | null = null

  const schedule = () => {
    if (pending !== null) cancelAnimationFrame(pending)
    // Плагин регистрирует свою прокрутку сразу после вставки содержимого, а
    // мы — из колбэка наблюдателя, то есть позже в том же кадре. Значит наша
    // прокрутка применяется последней, и рывка не видно.
    pending = requestAnimationFrame(() => {
      pending = null
      rebuild(layout)
    })
  }

  const observer = new MutationObserver((records) => {
    // Наблюдать приходится за раскладкой целиком: колонку превью плагин
    // создаёт сам, уже после нас. Но правки в СПИСКЕ результатов (путь и
    // счётчик в карточках) сюда попадать не должны — иначе каждый пришедший
    // счётчик сбрасывал бы совпадение, на котором стоит читатель.
    const touched = records.some(
      (record) =>
        record.target instanceof HTMLElement &&
        record.target.closest(".preview-container") !== null,
    )
    if (!touched) return

    const rebuilt = records.some((record) =>
      Array.from(record.addedNodes).some(
        (node) => node instanceof HTMLElement && node.classList.contains("preview-inner"),
      ),
    )

    if (!layout.querySelector(".preview-inner")) {
      bar.hidden = true
      previews.delete(layout)
      return
    }
    // Превью пересобрано — читатель ещё ничего в нём не прокручивал.
    if (rebuilt) userScrolled = false
    if (rebuilt || !userScrolled) schedule()
  })
  observer.observe(layout, { childList: true, subtree: true })

  // Картинки статьи догружаются уже после вставки и сдвигают содержимое.
  // Событие load не всплывает, поэтому слушаем на фазе перехвата. Если
  // читатель успел прокрутить превью сам, больше не вмешиваемся.
  const onLoad = () => {
    if (userScrolled) return
    const state = previews.get(layout)
    const container = layout.querySelector<HTMLElement>(".preview-container")
    if (!state || !container || state.matches.length === 0) return
    center(container, state.matches[state.index])
  }
  layout.addEventListener("load", onLoad, true)

  // Колесо и палец — однозначное «читаю сам». Прокрутку от scrollIntoView и
  // от нас самих сюда не заносит.
  const onUserScroll = (event: Event) => {
    if ((event.target as HTMLElement | null)?.closest(".preview-container")) userScrolled = true
  }
  layout.addEventListener("wheel", onUserScroll, { passive: true })
  layout.addEventListener("touchmove", onUserScroll, { passive: true })

  // Щелчок по подсветке в превью делает её активной — тогда переход по
  // карточке приведёт именно сюда.
  const onClick = (event: MouseEvent) => {
    const bumped = (event.target as HTMLElement | null)?.closest<HTMLElement>(".mkvs-match-step")
    if (bumped) {
      step(layout, bumped.classList.contains("mkvs-match-next") ? 1 : -1)
      return
    }
    const mark = (event.target as HTMLElement | null)?.closest<HTMLElement>(".highlight")
    const state = previews.get(layout)
    if (!mark || !state) return
    const index = state.matches.indexOf(mark)
    if (index !== -1) choose(layout, index, false)
  }
  layout.addEventListener("click", onClick)

  // Наведение на карточку, которая и так выделена, до плагина не доводим.
  //
  // Его обработчик mouseover безусловно перезапускает отрисовку превью — он
  // не проверяет, изменилось ли выделение. А превью он собирает заново:
  // очищает колонку, заново вставляет страницу и прокручивает её к своему
  // совпадению. Для читателя это выглядит так: выбрал нужное вхождение,
  // повёл мышь к названию файла, чтобы щёлкнуть по нему, — и превью
  // вернулось к началу вместе с выбором.
  //
  // Гасим событие на фазе перехвата: слушатель плагина висит на списке
  // результатов, то есть ниже по дереву. Условие узкое — превью уже
  // построено и показывает именно эту карточку, — поэтому случай, когда
  // отрисовка не удалась, ничего не теряет: там наведение сработает как
  // прежде.
  const onMouseOver = (event: MouseEvent) => {
    const card = (event.target as HTMLElement | null)?.closest<HTMLElement>(".result-card")
    if (!card || !card.classList.contains("focus")) return
    if (previews.get(layout)?.slug !== card.id) return
    if (!layout.querySelector(".preview-inner")) return
    event.stopPropagation()
  }
  layout.addEventListener("mouseover", onMouseOver, true)

  // Кнопки не должны забирать фокус у строки поиска: читатель листает
  // совпадения и продолжает править запрос.
  const onMouseDown = (event: MouseEvent) => {
    if ((event.target as HTMLElement | null)?.closest(".mkvs-match-step")) event.preventDefault()
  }
  bar.addEventListener("mousedown", onMouseDown)

  window.addCleanup(() => {
    observer.disconnect()
    layout.removeEventListener("load", onLoad, true)
    layout.removeEventListener("wheel", onUserScroll)
    layout.removeEventListener("touchmove", onUserScroll)
    layout.removeEventListener("click", onClick)
    layout.removeEventListener("mouseover", onMouseOver, true)
    bar.removeEventListener("mousedown", onMouseDown)
    if (pending !== null) cancelAnimationFrame(pending)
    delete layout.dataset.mkvsSearch
  })
}
