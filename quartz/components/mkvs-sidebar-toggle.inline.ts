// Клик по кнопке сворачивания левой колонки. Само состояние — атрибут
// data-left-sidebar на <html>; раскладку по нему перестраивает custom.scss.
// Первичное значение атрибута ставит mkvs-sidebar-state.inline.ts до отрисовки.

const STORAGE_KEY = "mkvs-left-sidebar"

function applyState(collapsed: boolean) {
  document.documentElement.dataset.leftSidebar = collapsed ? "collapsed" : "expanded"

  const label = collapsed ? "Показать панель навигации" : "Скрыть панель навигации"
  for (const button of document.querySelectorAll<HTMLButtonElement>(".mkvs-sidebar-toggle")) {
    button.setAttribute("aria-expanded", collapsed ? "false" : "true")
    button.setAttribute("aria-label", label)
    button.setAttribute("title", label)
  }
}

function installSidebarToggle() {
  applyState(document.documentElement.dataset.leftSidebar === "collapsed")

  for (const button of document.querySelectorAll<HTMLButtonElement>(".mkvs-sidebar-toggle")) {
    const onClick = () => {
      const collapsed = document.documentElement.dataset.leftSidebar !== "collapsed"
      applyState(collapsed)
      try {
        localStorage.setItem(STORAGE_KEY, collapsed ? "collapsed" : "expanded")
      } catch {
        // Состояние не сохранится, но в пределах сессии кнопка работает.
      }
    }

    button.addEventListener("click", onClick)
    window.addCleanup(() => button.removeEventListener("click", onClick))
  }
}

document.addEventListener("nav", installSidebarToggle)

// Строка ниже нужна только компилятору: MkvsSidebarToggle.tsx импортирует этот
// файл как текст скрипта, и без экспорта по умолчанию tsc ругается TS2306.
// Загрузчик inline-script-loader (quartz/cli/handlers.js) вырезает эту
// конструкцию перед сборкой, поэтому в браузер она не попадает.
//
// ВАЖНО: загрузчик ищет её простым поиском подстроки по всему файлу, так что
// упоминать её текстом в комментариях выше нельзя — вырежется комментарий,
// а сама строка останется и сломает сборку.
export default ""
