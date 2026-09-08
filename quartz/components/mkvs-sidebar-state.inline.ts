// Выполняется до отрисовки страницы (попадает в prescript.js, который
// подключён в <head>). Задача одна: поставить на <html> сохранённое состояние
// левой колонки, чтобы она не мигала при каждой загрузке страницы.
// Разворачивание и обработку клика делает mkvs-sidebar-toggle.inline.ts.
try {
  const saved = localStorage.getItem("mkvs-left-sidebar")
  document.documentElement.dataset.leftSidebar = saved === "collapsed" ? "collapsed" : "expanded"
} catch {
  // Приватный режим или запрет на хранилище — просто оставляем колонку видимой.
  document.documentElement.dataset.leftSidebar = "expanded"
}

// Строка ниже нужна только компилятору: MkvsSidebarToggle.tsx импортирует этот
// файл как текст скрипта, и без экспорта по умолчанию tsc ругается TS2306.
// Загрузчик inline-script-loader (quartz/cli/handlers.js) вырезает эту
// конструкцию перед сборкой, поэтому в браузер она не попадает.
//
// ВАЖНО: загрузчик ищет её простым поиском подстроки по всему файлу, так что
// упоминать её текстом в комментариях выше нельзя — вырежется комментарий,
// а сама строка останется и сломает сборку.
export default ""
