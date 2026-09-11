// Разбор адреса открытой страницы — общее для скриптов надстройки.
//
// Сравнивать window.location.pathname с адресами ссылок напрямую нельзя:
// на GitHub Pages сайт лежит в подкаталоге, адрес может быть закодирован
// процентами, а одна и та же страница пишется и как «lab01/», и как
// «lab01/index», и как «lab01/index.html».

// Базовый путь сайта, без хвостового слэша. На GitHub Pages это «/MKVS_doc»,
// на локальной сборке — пустая строка.
export function basePath(): string {
  return (document.body.dataset.basepath ?? "").replace(/\/+$/, "")
}

// Приводит адрес к виду «lab01/01-main»: без базового пути сайта, без
// расширения, без хвостового /index и без слэшей по краям. Титульная
// страница сайта даёт пустую строку.
export function normalizePath(pathname: string, base: string): string {
  let value = pathname
  try {
    value = decodeURIComponent(value)
  } catch {
    // Некорректно закодированный адрес сравниваем как есть.
  }
  if (base && value.startsWith(base)) value = value.slice(base.length)
  value = value.replace(/\.html?$/, "")
  value = value.replace(/^\/+|\/+$/g, "")
  value = value.replace(/(?:^|\/)index$/, "")
  return value
}

// Открыта ли сейчас титульная страница сайта.
export function onHomePage(base: string): boolean {
  return normalizePath(window.location.pathname, base) === ""
}
