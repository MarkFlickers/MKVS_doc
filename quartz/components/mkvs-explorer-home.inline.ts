// Ссылка на титульную страницу первой строкой Проводника.
//
// Проводник строит дерево из того, что лежит НИЖЕ корня content, поэтому сам
// content/index.md в нём не показывается. На широком экране это незаметно: над
// деревом стоит название сайта (.page-title), и оно ведёт на титульную. Но на
// телефоне левая колонка сворачивается в верхнюю панель, а название из неё
// убрано — в строку оно не помещается (custom.scss, п. 12). В результате с
// телефона на титульную страницу было не попасть: «хлебных крошек» на верхнем
// уровне работы нет, а в выезжающем дереве — только папки.
//
// Скрипт добавляет ссылку в начало .explorer-content. На широком экране она
// скрыта стилями, чтобы не дублировать название сайта (custom.scss, п. 14).

import { basePath, onHomePage } from "./scripts/mkvs-path"

const HOME_CLASS = "mkvs-explorer-home"
const HOME_LABEL = "Микроконтроллеры и встраиваемые системы"

// Корневой адрес сайта: базовый путь плюс слэш. На GitHub Pages сайт лежит в
// подкаталоге, поэтому «/» без базового пути увёл бы на чужую страницу.
function homeHref(base: string): string {
  return `${base}/`
}

function buildHome(base: string): HTMLElement {
  const item = document.createElement("div")
  item.className = HOME_CLASS

  const link = document.createElement("a")
  link.href = homeHref(base)
  link.textContent = HOME_LABEL

  item.append(link)
  return item
}

function syncExplorerHome() {
  const base = basePath()

  for (const content of document.querySelectorAll<HTMLElement>(".explorer > .explorer-content")) {
    let item = content.querySelector<HTMLElement>(`:scope > .${HOME_CLASS}`)
    if (!item) {
      item = buildHome(base)
      content.prepend(item)
    }

    // Подсветка текущей страницы — тем же классом, что расставляет
    // mkvs-explorer-nav.inline.ts остальным узлам дерева.
    item.querySelector("a")?.classList.toggle("mkvs-nav-current", onHomePage(base))
  }
}

function installExplorerHome() {
  syncExplorerHome()

  // Дерево строится асинхронно и перерисовывается при сворачивании папок.
  // Ссылка лежит рядом с .explorer-ul, а не внутри неё, поэтому обычная
  // перерисовка списка её не трогает; наблюдатель нужен на случай, когда
  // плагин пересобирает .explorer-content целиком.
  //
  // Зацикливания нет: вставка порождает мутацию, на следующем проходе ссылка
  // уже на месте и ничего не добавляется, а смена класса не отслеживается —
  // наблюдатель подписан только на childList.
  for (const explorer of document.querySelectorAll<HTMLElement>(".explorer")) {
    const observer = new MutationObserver(syncExplorerHome)
    observer.observe(explorer, { childList: true, subtree: true })
    window.addCleanup(() => observer.disconnect())
  }
}

document.addEventListener("nav", installExplorerHome)

// Про строку ниже — README.md, раздел «Инлайн-скрипты».
export default ""
