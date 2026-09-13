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

// --- путь до страницы -------------------------------------------------------
// Функции ниже работают со slug, а не с адресом в браузере, и окружения не
// касаются. Поэтому ими пользуется не только скрипт поиска (строка пути в
// карточке результата, mkvs-search-cards.ts), но и серверный компонент кнопок
// «Предыдущее/Следующее» (MkvsPrevNext.tsx): путь до страницы в обоих местах
// должен читаться одинаково.

const PATH_SEPARATOR = " › "

// «lab02/02-main» -> ["lab02/index"]: папки, в которые входит страница, сверху
// вниз. Для самой страницы работы (labNN/index) родитель — корень сайта, и
// путь не нужен: название сайта уже стоит над Проводником.
export function parentSlugs(slug: string): string[] {
  const parts = slug.split("/")
  parts.pop()
  if (slug.endsWith("/index")) parts.pop()

  const chain: string[] = []
  for (let i = 0; i < parts.length; i++) {
    chain.push(parts.slice(0, i + 1).join("/") + "/index")
  }
  return chain
}

// «lab02/02-main» -> «Лабораторная работа 02. CMSIS. …». Названия папок
// поставляет вызывающий: в браузере они берутся из contentIndex.json, при
// сборке — из дерева страниц. Папку без названия подписывает её сегмент
// адреса. У страниц верхнего уровня путь — пустая строка.
export function pagePath(slug: string, titleOf: (parent: string) => string | undefined): string {
  return parentSlugs(slug)
    .map((parent, depth) => titleOf(parent) ?? parent.split("/")[depth])
    .join(PATH_SEPARATOR)
}
