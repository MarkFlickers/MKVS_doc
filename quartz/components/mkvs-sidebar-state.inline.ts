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

// Про строку ниже — README.md, раздел «Инлайн-скрипты».
export default ""
