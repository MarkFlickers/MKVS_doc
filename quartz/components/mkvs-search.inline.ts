// Поиск: путь и число совпадений в карточке результата, листание совпадений в
// превью и переход ровно к тому совпадению, которое читатель смотрел.
//
// Что делает плагин @quartz-community/search сам:
//   • ищет по странице целиком — в индексе FlexSearch один документ на файл,
//     разделов и якорей там нет;
//   • в карточке результата показывает только заголовок страницы и ОДИН
//     фрагмент: окно в 60 слов вокруг самого плотного скопления совпадений
//     (на широком экране этот фрагмент вдобавок спрятан его собственным CSS —
//     display: none, см. п.9 custom.scss);
//   • в превью справа подсвечивает ВСЕ совпадения, но прокручивает окно к
//     самому длинному из них и никак не показывает, сколько их всего;
//   • по клику кладёт запрос в sessionStorage['search-term'], а на открытой
//     странице прокручивает к ПЕРВОМУ вхождению — перебирая сначала все
//     заголовки и только потом абзацы, независимо от того, что читатель
//     листал в превью.
//
// Скрипт ничего не меняет в плагине, а дополняет его разметку:
//   1) в карточку добавляется путь («Лабораторная работа 02») и число
//      совпадений в файле;
//   2) над превью появляется панель «‹ 3 / 12 ›»: активное совпадение
//      подсвечено ярче, стрелки и Alt+↑/↓ листают совпадения по кругу, а
//      выбранное совпадение держится, пока не сменится запрос;
//   3) при переходе запоминается номер активного совпадения, и на открытой
//      странице подсветка ставится именно на него.
//
// Ключевое требование: нумерация совпадений в превью и на самой странице
// обязана совпадать. Поэтому совпадения и там, и там ищутся ОДНИМ И ТЕМ ЖЕ
// способом — обходом текстовых узлов внутри .popover-hint тем же регулярным
// выражением, которое строит плагин (см. terms() ниже).

// ---------------------------------------------------------------------------
// Разбор запроса — повторяет плагин
// ---------------------------------------------------------------------------

// Плагин ищет не только слова запроса, но и их нарастающие сочетания:
// «настройка GPIO» -> ["настройка", "GPIO", "настройка GPIO"]. Порядок по
// убыванию длины важен: в регулярном выражении сочетание должно стоять раньше
// отдельных слов, иначе фраза посчиталась бы двумя совпадениями вместо одного.
function terms(query: string): string[] {
  const words = query.split(/\s+/).filter((word) => word.trim() !== "")
  const count = words.length
  if (count > 1) {
    for (let i = 1; i < count; i++) words.push(words.slice(0, i + 1).join(" "))
  }
  return words.sort((a, b) => b.length - a.length)
}

function matcher(query: string): RegExp | null {
  const parts = terms(query)
    .filter((word) => word.trim() !== "")
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  if (parts.length === 0) return null
  return new RegExp(parts.join("|"), "gi")
}

// Слова, начинающиеся с решётки, — это фильтр по тегам, в подсветку они не
// идут. Пустой запрос при поиске по тегам плагин заменяет именами тегов.
function termOf(input: HTMLInputElement): string {
  const raw = input.value
  const tags: string[] = []
  const words: string[] = []
  for (const word of raw.split(/\s+/)) {
    if (word.startsWith("#")) tags.push(word.substring(1))
    else if (word !== "") words.push(word)
  }
  const query = words.join(" ").trim()
  return query || (tags.length > 0 ? tags.join(" ") : raw.trim())
}

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

function countIn(texts: string[], regex: RegExp): number {
  let count = 0
  for (const text of texts) {
    regex.lastIndex = 0
    while (regex.exec(text) !== null) count++
  }
  return count
}

type Match = { node: Text; start: number; end: number }

// Совпадения в порядке документа. Плагин подсвечивает превью так же —
// текстовый узел за текстовым узлом, — поэтому N-е совпадение здесь и N-я
// подсветка в превью указывают на одно и то же место.
function findMatches(doc: Document, regex: RegExp): Match[] {
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

function textsFor(href: string): Promise<string[]> {
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

// «lab02/02-main» -> ["lab02/index"]: цепочка страниц-родителей. Для самой
// страницы работы (labNN/index) родитель — корень сайта, и путь не нужен:
// название сайта уже стоит над Проводником.
function ancestorsOf(slug: string): string[] {
  const parts = slug.split("/")
  parts.pop()
  if (slug.endsWith("/index")) parts.pop()

  const chain: string[] = []
  for (let i = 0; i < parts.length; i++) {
    chain.push(parts.slice(0, i + 1).join("/") + "/index")
  }
  return chain
}

async function pathOf(slug: string): Promise<string> {
  const index = await fetchData
  const titles = index as unknown as Record<string, { title?: string } | undefined>
  return ancestorsOf(slug)
    .map((parent, depth) => titles[parent]?.title ?? parent.split("/")[depth])
    .join(" › ")
}

function decorateCards(container: HTMLElement, term: string) {
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

// ---------------------------------------------------------------------------
// Превью: панель «‹ 3 / 12 ›»
// ---------------------------------------------------------------------------

type Preview = { slug: string; matches: HTMLElement[]; index: number }

const previews = new WeakMap<HTMLElement, Preview>()

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
  // position: relative в п.9 custom.scss лечит его арифметику.)
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
function step(layout: HTMLElement, delta: number) {
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

function installPreview(layout: HTMLElement) {
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

// ---------------------------------------------------------------------------
// Переход: запоминаем активное совпадение
// ---------------------------------------------------------------------------

const JUMP_KEY = "mkvs-search-jump"

type Jump = { slug: string; term: string; index: number; time: number }

function remember(card: HTMLAnchorElement, input: HTMLInputElement) {
  const term = termOf(input)
  if (!term) return

  const layout = card.closest<HTMLElement>(".search-layout")
  const state = layout ? previews.get(layout) : undefined
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

function takeJump(): Jump | null {
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

function applyJump(jump: Jump) {
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

// ---------------------------------------------------------------------------
// Установка
// ---------------------------------------------------------------------------

function installSearch() {
  for (const search of document.querySelectorAll<HTMLElement>(".search")) {
    const layout = search.querySelector<HTMLElement>(".search-layout")
    const results = search.querySelector<HTMLElement>(".results-container")
    const input = search.querySelector<HTMLInputElement>(".search-bar")
    if (!layout || !input) continue
    if (layout.dataset.mkvsSearch === "true") continue
    layout.dataset.mkvsSearch = "true"

    installPreview(layout)

    // Список результатов плагин создаёт сам при первом открытии окна поиска,
    // поэтому наблюдаем за раскладкой целиком, а не только за списком.
    const target = results ?? layout
    const cards = new MutationObserver(() => {
      const container = layout.querySelector<HTMLElement>(".results-container")
      if (container) decorateCards(container, termOf(input))
    })
    cards.observe(target, { childList: true, subtree: true })

    // Клик по карточке и Enter на выделенной карточке — два разных пути в
    // плагине. Оба ловятся на фазе перехвата: по Enter плагин успевает
    // закрыть окно поиска и очистить список ДО того, как сработает ссылка.
    const onClick = (event: MouseEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      const card = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>(".result-card")
      if (!card || card.classList.contains("no-match")) return
      remember(card, input)
    }
    document.addEventListener("click", onClick, true)

    const onKeyDown = (event: KeyboardEvent) => {
      // Клавиши перехватываются только при открытом окне поиска: Alt+стрелки
      // за его пределами принадлежат браузеру (это переход по истории).
      const open = search.querySelector(".search-container.active") !== null
      if (!open) return

      if (event.altKey && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
        // Стрелки без Alt плагин тратит на перебор результатов, поэтому
        // совпадения листаются с Alt. Событие до плагина не доводим.
        event.preventDefault()
        event.stopPropagation()
        step(layout, event.key === "ArrowDown" ? 1 : -1)
        return
      }
      if (event.key !== "Enter" || event.isComposing) return
      // Открытый список подсказок по тегам забирает Enter себе — перехода не
      // будет.
      const tags = search.querySelector<HTMLElement>(".tag-suggestions")
      if (tags && tags.style.display !== "none" && tags.querySelector(".active")) return
      const card = layout.querySelector<HTMLAnchorElement>(".result-card.focus")
      if (card) remember(card, input)
    }
    document.addEventListener("keydown", onKeyDown, true)

    window.addCleanup(() => {
      cards.disconnect()
      document.removeEventListener("click", onClick, true)
      document.removeEventListener("keydown", onKeyDown, true)
    })
  }

  const jump = takeJump()
  if (!jump) return

  // Штатный переход плагина к ПЕРВОМУ вхождению отменяем, забрав у него запрос.
  //
  // Момент выбран не случайно. Плагин читает sessionStorage в самом конце
  // своего обработчика nav — после того, как загрузит FlexSearch и построит
  // индекс, то есть за двумя await. Мы же удаляем ключ ЗДЕСЬ И СЕЙЧАС,
  // синхронно внутри того же события nav, и порядок обработчиков роли не
  // играет: любой await отдаёт управление нам.
  //
  // Поправить его прокрутку задним числом не выйдет: при переходе по Enter
  // плагин закрывает окно поиска до щелчка по ссылке, страница из-за этого
  // перезагружается целиком, и его подсветка встаёт на секунду позже нашей —
  // на странице оказались бы две подсветки, и его прокрутка легла бы поверх.
  //
  // Если записи о переходе нет (обычный переход по ссылке, чужая вкладка),
  // ключ не трогаем — поиск ведёт себя ровно как без надстройки.
  try {
    sessionStorage.removeItem("search-term")
  } catch {
    // Приватный режим браузера — читать там было всё равно нечего.
  }

  // Двойной кадр: к этому времени страница успевает встать на место после
  // перехода, и прокрутка к совпадению не спорит с восстановлением позиции.
  requestAnimationFrame(() => requestAnimationFrame(() => applyJump(jump)))
}

document.addEventListener("nav", installSearch)

// Строка ниже нужна только компилятору: MkvsSearch.tsx импортирует этот файл
// как текст скрипта, и без экспорта по умолчанию tsc ругается TS2306.
// Загрузчик inline-script-loader (quartz/cli/handlers.js) вырезает эту
// конструкцию перед сборкой, поэтому в браузер она не попадает.
//
// ВАЖНО: загрузчик ищет её простым поиском подстроки по всему файлу, так что
// упоминать её текстом в комментариях выше нельзя — вырежется комментарий,
// а сама строка останется и сломает сборку.
export default ""
