// Сборка верхней панели на узком экране. Зачем это делается переносом узлов, а
// не стилями — в MkvsMobileBar.tsx.
//
// Переносятся ровно два узла: переключатель темы (.darkmode из панели над
// текстом) и оглавление (.toc из правой колонки, где на телефоне оно штатно
// скрыто). Место, откуда узел взят, помечается комментарием-якорем, поэтому
// вернуть узел обратно можно и после того, как соседи вокруг него изменились.

const MOBILE = "(max-width: 800px)"

// Узлы, которые переносятся в панель, и якоря на их исходных местах.
type Moved = { node: HTMLElement; anchor: Comment }

let moved: Moved[] = []

const bar = () => document.querySelector<HTMLElement>(".page > #quartz-body > .sidebar.left")

// Оглавление на телефоне — выпадающий список под панелью, и открываться он
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

function moveIntoBar() {
  const target = bar()
  if (!target || moved.length > 0) return

  for (const selector of [".center .page-header .darkmode", ".right.sidebar .toc"]) {
    const node = document.querySelector<HTMLElement>(selector)
    if (!node?.parentNode) continue

    const anchor = document.createComment("mkvs-mobile-bar")
    node.parentNode.insertBefore(anchor, node)
    target.appendChild(node)
    moved.push({ node, anchor })
  }

  const toc = target.querySelector<HTMLElement>(":scope > .toc")
  if (toc) setTocCollapsed(toc, true)
}

function restore() {
  for (const { node, anchor } of moved) {
    if (node.classList.contains("toc")) setTocCollapsed(node, false)
    // Якоря может уже не быть: страницу мог перерисовать SPA-роутер.
    if (anchor.parentNode) anchor.replaceWith(node)
    else anchor.remove()
  }
  moved = []
}

function sync() {
  if (window.matchMedia(MOBILE).matches) moveIntoBar()
  else restore()
}

function installMobileBar() {
  sync()

  // Переход по пункту оглавления закрывает список: иначе он остался бы
  // висеть поверх текста, к которому читатель только что перешёл.
  const toc = bar()?.querySelector<HTMLElement>(":scope > .toc")
  const onClick = (event: Event) => {
    if ((event.target as HTMLElement).closest("a")) setTocCollapsed(toc!, true)
  }
  if (toc) {
    toc.addEventListener("click", onClick)
    window.addCleanup(() => toc.removeEventListener("click", onClick))
  }

  // Перед подменой страницы возвращаем узлы на места: SPA-роутер сравнивает
  // текущий документ с загруженным, и расхождение в разметке ему только мешает.
  window.addCleanup(restore)
}

document.addEventListener("nav", installMobileBar)

// Поворот экрана и смена ширины окна: раскладка меняется без навигации.
window.matchMedia(MOBILE).addEventListener("change", sync)

// Строка ниже нужна только компилятору: MkvsMobileBar.tsx импортирует этот
// файл как текст скрипта, и без экспорта по умолчанию tsc ругается TS2306.
// Загрузчик inline-script-loader (quartz/cli/handlers.js) вырезает эту
// конструкцию перед сборкой, поэтому в браузер она не попадает.
//
// ВАЖНО: загрузчик ищет её простым поиском подстроки по всему файлу, так что
// упоминать её текстом в комментариях выше нельзя — вырежется комментарий,
// а сама строка останется и сломает сборку.
export default ""
