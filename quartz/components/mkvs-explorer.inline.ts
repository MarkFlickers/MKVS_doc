// Надстройки к Проводнику: подсветка места в дереве и ссылка на титульную.
//
// Обе делают одно и то же с одним и тем же деревом, поэтому живут в одном
// файле и обходятся ОДНИМ наблюдателем за перерисовкой. Раньше это были два
// скрипта, и на каждую перерисовку дерева отрабатывали два независимых
// MutationObserver'а двумя проходами по DOM. Логика к тому же переплеталась:
// ссылка на титульную подсвечивается тем же классом .mkvs-nav-current, что
// расставляет по дереву подсветка.
//
// 1. ПОДСВЕТКА ТЕКУЩЕГО МЕСТА
//
// Что делает сам Quartz: файловым ссылкам текущей страницы он добавляет класс
// active. Чего не делает: не подсвечивает папки — ни ту, что соответствует
// открытой странице (у нас это content/labNN/index.md, в дереве она папка),
// ни родительские.
//
// Скрипт добавляет два своих класса:
//   .mkvs-nav-current — узел открытой страницы (файл или папка);
//   .mkvs-nav-parent  — контейнер каждой папки-родителя выше по дереву.
//
// 2. ССЫЛКА НА ТИТУЛЬНУЮ СТРАНИЦУ
//
// Проводник строит дерево из того, что лежит НИЖЕ корня content, поэтому сам
// content/index.md в нём не показывается. На широком экране это незаметно: над
// деревом стоит название сайта (.page-title), и оно ведёт на титульную. Но на
// телефоне левая колонка сворачивается в верхнюю панель, а название из неё
// убрано — в строку оно не помещается (см. styles/mkvs/_compact.scss). В
// результате с
// телефона на титульную страницу было не попасть: «хлебных крошек» на верхнем
// уровне работы нет, а в выезжающем дереве — только папки.
//
// Ссылка добавляется в начало .explorer-content. На широком экране она скрыта
// стилями, чтобы не дублировать название сайта
// (styles/mkvs/_compact.scss).
//
// Оформление того и другого — в styles/mkvs/_explorer.scss.

import { basePath, normalizePath, onHomePage } from "./scripts/mkvs-path"

const HOME_CLASS = "mkvs-explorer-home"
const HOME_LABEL = "Микроконтроллеры и встраиваемые системы"

// --- подсветка текущего места ----------------------------------------------

function markNav(base: string) {
  const here = normalizePath(window.location.pathname, base)

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
        if (normalizePath(new URL(link.href, window.location.href).pathname, base) === here) {
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

// --- ссылка на титульную страницу -------------------------------------------

function buildHome(base: string): HTMLElement {
  const item = document.createElement("div")
  item.className = HOME_CLASS

  const link = document.createElement("a")
  // Корневой адрес сайта: базовый путь плюс слэш. На GitHub Pages сайт лежит
  // в подкаталоге, поэтому «/» без базового пути увёл бы на чужую страницу.
  link.href = `${base}/`
  link.textContent = HOME_LABEL

  item.append(link)
  return item
}

function markHome(base: string) {
  for (const content of document.querySelectorAll<HTMLElement>(".explorer > .explorer-content")) {
    let item = content.querySelector<HTMLElement>(`:scope > .${HOME_CLASS}`)
    if (!item) {
      item = buildHome(base)
      content.prepend(item)
    }

    // Подсветка — тем же классом, что markNav() расставляет остальным узлам.
    item.querySelector("a")?.classList.toggle("mkvs-nav-current", onHomePage(base))
  }
}

// --- установка --------------------------------------------------------------

function syncExplorer() {
  const base = basePath()
  markNav(base)
  markHome(base)
}

function installExplorer() {
  syncExplorer()

  // Дерево Проводника строится асинхронно и перерисовывается при сворачивании
  // папок, поэтому за каждым следит наблюдатель — один на Проводник.
  //
  // Зацикливания нет: вставка ссылки порождает мутацию, но на следующем
  // проходе ссылка уже на месте и ничего не добавляется, а смена классов не
  // отслеживается — наблюдатель подписан только на childList.
  for (const explorer of document.querySelectorAll<HTMLElement>(".explorer")) {
    const observer = new MutationObserver(syncExplorer)
    observer.observe(explorer, { childList: true, subtree: true })
    window.addCleanup(() => observer.disconnect())
  }
}

document.addEventListener("nav", installExplorer)

// Про строку ниже — README.md, раздел «Инлайн-скрипты».
export default ""
