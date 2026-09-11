// Подсветка текущей страницы и всех её родителей в Проводнике.
//
// Что делает сам Quartz: файловым ссылкам текущей страницы он добавляет класс
// active. Чего не делает: не подсвечивает папки — ни ту, что соответствует
// открытой странице (у нас это content/labNN/index.md, в дереве она папка),
// ни родительские.
//
// Скрипт добавляет два своих класса:
//   .mkvs-nav-current — узел открытой страницы (файл или папка);
//   .mkvs-nav-parent  — контейнер каждой папки-родителя выше по дереву.
// Оформление — в custom.scss.

// Приводит адрес к виду «lab01/01-main»: без базового пути сайта, без
// расширения, без хвостового /index и без слэшей по краям.
function normalize(pathname: string, base: string): string {
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

function markExplorerNav() {
  const base = (document.body.dataset.basepath ?? "").replace(/\/+$/, "")
  const here = normalize(window.location.pathname, base)

  for (const explorer of document.querySelectorAll<HTMLElement>(".explorer")) {
    const tree = explorer.querySelector<HTMLElement>(".explorer-ul")
    if (!tree) continue

    for (const marked of tree.querySelectorAll(".mkvs-nav-current, .mkvs-nav-parent")) {
      marked.classList.remove("mkvs-nav-current", "mkvs-nav-parent")
    }

    // Узел текущей страницы: либо файловая ссылка, которую пометил Quartz,
    // либо папка, чей адрес совпадает с адресом открытой страницы.
    let current: HTMLElement | null = tree.querySelector<HTMLAnchorElement>("a.active")

    if (!current) {
      for (const link of tree.querySelectorAll<HTMLAnchorElement>("a.folder-button")) {
        if (normalize(new URL(link.href, window.location.href).pathname, base) === here) {
          current = link
          break
        }
      }
    }

    if (!current) continue
    current.classList.add("mkvs-nav-current")

    // Вверх по дереву: у каждого <li>-предка помечаем заголовок его папки.
    let item = current.closest<HTMLElement>("li")?.parentElement?.closest<HTMLElement>("li")
    while (item) {
      item
        .querySelector<HTMLElement>(":scope > .folder-container")
        ?.classList.add("mkvs-nav-parent")
      item = item.parentElement?.closest<HTMLElement>("li") ?? null
    }
  }
}

function installExplorerNav() {
  markExplorerNav()

  // Дерево Проводника строится асинхронно и перерисовывается при смене
  // состояния папок, поэтому следим за ним и помечаем узлы заново.
  for (const explorer of document.querySelectorAll<HTMLElement>(".explorer")) {
    const observer = new MutationObserver(markExplorerNav)
    observer.observe(explorer, { childList: true, subtree: true })
    window.addCleanup(() => observer.disconnect())
  }
}

document.addEventListener("nav", installExplorerNav)

// Про строку ниже — README.md, раздел «Инлайн-скрипты».
export default ""
