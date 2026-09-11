// Раскладка элементов управления по режиму экрана. Зачем это делается
// переносом узлов, а не стилями — в MkvsMobileBar.tsx.
//
// Переносятся ровно два узла: переключатель темы (.darkmode из панели над
// текстом) и оглавление (.toc из правой колонки). Место, откуда узел взят,
// помечается комментарием-якорем, поэтому вернуть узел обратно можно и после
// того, как соседи вокруг него изменились.

// Режим вычисляет CSS (custom.scss, п.6) и отдаёт его готовым свойством. Так границы
// раскладки записаны РОВНО В ОДНОМ месте: скрипт не повторяет ни ширины, ни
// высоты и не может разойтись со стилями.
type Mode = "compact" | "columns-2" | "columns-3"

function currentMode(): Mode {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue("--mkvs-layout")
    .trim()
    .replace(/^"|"$/g, "")

  return value === "compact" || value === "columns-2" ? value : "columns-3"
}

// Верхняя панель компактного режима — это левая колонка: в ней лежит
// «гамбургер» Проводника, привязанный к своему дереву, поэтому панелью может
// быть только она.
const bar = () => document.querySelector<HTMLElement>(".page > #quartz-body > .sidebar.left")

// Панель над текстом: в ней стоят кнопки сворачивания Проводника и темы.
const textHeader = () => document.querySelector<HTMLElement>(".page > #quartz-body header")

// Что и куда переезжает. null — «остаться там, где стоит в разметке».
const PLAN: { home: string; hostFor: (mode: Mode) => HTMLElement | null }[] = [
  {
    // Переключатель темы: в компактном режиме уходит в панель, к остальным
    // кнопкам, чтобы все четыре стояли одной строкой.
    home: ".center .page-header .darkmode",
    hostFor: (mode) => (mode === "compact" ? bar() : null),
  },
  {
    // Оглавление: колонкой оно стоит только в columns-3, в остальных режимах
    // для колонки нет места и оглавление становится кнопкой (custom.scss, п.8.1).
    home: ".right.sidebar .toc",
    hostFor: (mode) => (mode === "compact" ? bar() : mode === "columns-2" ? textHeader() : null),
  },
]

type Managed = { node: HTMLElement; anchor: Comment; hostFor: (mode: Mode) => HTMLElement | null }

let managed: Managed[] = []

// Режим, под который разложены узлы сейчас. null — «ещё не раскладывали»
// (страница только что отрисована).
let applied: Mode | null = null

// Оглавление вне колонки — выпадающий список под кнопкой, и открываться он
// должен по кнопке, а не сразу. Класс collapsed — штатный: его же ставит и
// снимает скрипт плагина при нажатии на .toc-header, так что дальше кнопка
// работает сама.
function setTocCollapsed(toc: HTMLElement, collapsed: boolean) {
  const header = toc.querySelector<HTMLElement>(".toc-header")
  const content = toc.querySelector<HTMLElement>(".toc-content")
  if (!header || !content) return

  header.classList.toggle("collapsed", collapsed)
  content.classList.toggle("collapsed", collapsed)
  header.setAttribute("aria-expanded", collapsed ? "false" : "true")
}

function place(item: Managed, host: HTMLElement | null) {
  if (host) {
    // Кнопка «Назад» глоссария занимает в панели над текстом отдельную строку
    // (custom.scss, п.11), поэтому вставляем перед ней, а не в конец.
    const tail = host.querySelector<HTMLElement>(":scope > .mkvs-glossary-back")
    host.insertBefore(item.node, tail)
    return
  }

  // Якоря может уже не быть: страницу мог перерисовать SPA-роутер.
  if (item.anchor.parentNode)
    item.anchor.parentNode.insertBefore(item.node, item.anchor.nextSibling)
}

function sync() {
  const mode = currentMode()
  if (mode === applied) return
  applied = mode

  for (const item of managed) {
    place(item, item.hostFor(mode))
    if (item.node.classList.contains("toc")) setTocCollapsed(item.node, mode !== "columns-3")
  }
}

// Перед подменой страницы возвращаем узлы на места: SPA-роутер сравнивает
// текущий документ с загруженным, и расхождение в разметке ему только мешает.
function restore() {
  for (const item of managed) {
    if (item.node.classList.contains("toc")) setTocCollapsed(item.node, false)
    if (item.anchor.parentNode) item.anchor.replaceWith(item.node)
    else item.anchor.remove()
  }
  managed = []
  applied = null
}

function installMobileBar() {
  managed = []
  applied = null

  for (const { home, hostFor } of PLAN) {
    const node = document.querySelector<HTMLElement>(home)
    if (!node?.parentNode) continue

    const anchor = document.createComment("mkvs-home")
    node.parentNode.insertBefore(anchor, node)
    managed.push({ node, anchor, hostFor })
  }

  sync()

  // Переход по пункту оглавления закрывает список: иначе он остался бы висеть
  // поверх текста, к которому читатель только что перешёл. В колонке (режим
  // columns-3) закрывать нечего, поэтому проверяем текущий режим.
  const toc = managed.find((item) => item.node.classList.contains("toc"))?.node
  if (toc) {
    const onClick = (event: Event) => {
      if (applied !== "columns-3" && (event.target as HTMLElement).closest("a")) {
        setTocCollapsed(toc, true)
      }
    }

    toc.addEventListener("click", onClick)
    window.addCleanup(() => toc.removeEventListener("click", onClick))
  }

  window.addCleanup(restore)
}

document.addEventListener("nav", installMobileBar)

// Поворот экрана и смена размеров окна: режим меняется без навигации. Слушаем
// resize, а не matchMedia, именно потому, что границы известны только CSS.
let pending = false
window.addEventListener("resize", () => {
  if (pending) return
  pending = true
  requestAnimationFrame(() => {
    pending = false
    sync()
  })
})

// Про строку ниже — README.md, раздел «Инлайн-скрипты».
export default ""
