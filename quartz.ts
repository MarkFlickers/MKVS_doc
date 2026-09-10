import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { readFileSync } from "fs"
import { join } from "path"
import type { QuartzComponent } from "./quartz/components/types"
import { PageTypeDispatcher } from "./quartz/plugins/pageTypes/dispatcher"
import TocCollapse from "./quartz/components/MkvsTocCollapse"
import ExplorerNav from "./quartz/components/MkvsExplorerNav"
import ExplorerHome from "./quartz/components/MkvsExplorerHome"
import SearchPreview from "./quartz/components/MkvsSearchPreview"
import SidebarToggle from "./quartz/components/MkvsSidebarToggle"
import Glossary from "./quartz/components/MkvsGlossary"
import GlossaryBack from "./quartz/components/MkvsGlossaryBack"
import MobileBar from "./quartz/components/MkvsMobileBar"
import PrevNext from "./quartz/components/MkvsPrevNext"

const config = await loadQuartzConfig()
export default config
export const layout = await loadQuartzLayout()

// Штатные компоненты Quartz дополняются своими надстройками.
// Все они ничего не меняют в самих плагинах — только добавляют поведение
// поверх готовой разметки, чтобы обновление плагинов ничего не ломало.
for (const pageLayout of [layout.defaults, ...Object.values(layout.byPageType)]) {
  // Кнопка сворачивания левой колонки — первой в верхней панели,
  // левее переключателя темы (он приходит из конфига с priority 20).
  //
  // Следом, последней в разметке, — кнопка «Назад» статьи глоссария: в панели
  // она уходит на отдельную строку под кнопку Проводника. На остальных
  // страницах компонент ничего не рисует.
  if (pageLayout.header?.length && !pageLayout.header.includes(SidebarToggle)) {
    pageLayout.header = [SidebarToggle, ...pageLayout.header, GlossaryBack]
  }

  // Подсветка текущей страницы и её родителей в Проводнике, ссылка на
  // титульную страницу первой строкой дерева и центрирование найденного
  // фрагмента в превью поиска — надстройки к левой колонке.
  if (pageLayout.left?.length && !pageLayout.left.includes(ExplorerNav)) {
    pageLayout.left = [...pageLayout.left, ExplorerNav, ExplorerHome, SearchPreview]
  }

  // Сворачивание разделов и подсветка текущего раздела в оглавлении.
  if (pageLayout.right?.length && !pageLayout.right.includes(TocCollapse)) {
    pageLayout.right = [...pageLayout.right, TocCollapse]
  }

  // Кнопки «Предыдущее/Следующее» — первыми под текстом страницы, до
  // компонентов-невидимок ниже. Раскладка afterBody выводит их сразу за
  // разделительной чертой в подвале статьи (components/frames/DefaultFrame.tsx).
  if (!pageLayout.afterBody?.includes(PrevNext)) {
    pageLayout.afterBody = [PrevNext, ...(pageLayout.afterBody ?? [])]
  }

  // Подсказки к терминам глоссария. Скрипт нужен в теле любой страницы, а не
  // только там, где есть боковые колонки, поэтому компонент добавляется в
  // afterBody — он присутствует во всех раскладках.
  if (!pageLayout.afterBody?.includes(Glossary)) {
    pageLayout.afterBody = [...(pageLayout.afterBody ?? []), Glossary]
  }

  // Сборка верхней панели на телефоне. Скрипту тоже нужна любая страница,
  // поэтому компонент живёт рядом с глоссарием — в afterBody.
  if (!pageLayout.afterBody?.includes(MobileBar)) {
    pageLayout.afterBody = [...(pageLayout.afterBody ?? []), MobileBar]
  }
}

// Плагины Quartz зашивают мобильную границу 800px прямо в свой CSS, а он
// приезжает из npm уже собранным — переменной, которую можно было бы
// подкрутить, там нет. Из-за этого низкий, но широкий экран (телефон в
// альбомной ориентации — примерно 890x400) не получал ни выезжающего дерева
// Проводника, ни мобильного окна поиска: по ширине он «планшет».
//
// Сайт же считает такой экран компактным (custom.scss, п.6 — граница по
// ширине ИЛИ по высоте). Приводим CSS плагинов к тому же условию: подменяем
// в нём ровно ту строку, которой записан мобильный @media-запрос.
//
// Запросов два: «мобильный» и обратный ему (в CSS поиска им отключается
// колонка предпросмотра). Переводить нужно оба, иначе на низком экране окно
// поиска собралось бы из половинок двух разных раскладок.
//
// Замена намеренно узкая — по точному совпадению целиком. Если плагин
// обновится и запишет запрос иначе, ничего не сломается: подмена просто не
// найдёт что менять, компактный режим на низком экране потеряет выезжающее
// дерево, и об этом скажет предупреждение ниже.
const PLUGIN_MOBILE = "@media all and (max-width: 800px)"
const PLUGIN_NOT_MOBILE = "@media all and not (max-width: 800px)"

// Числа границ здесь НЕ повторяются, а читаются из самих стилей: иначе правка
// в custom.scss молча разошлась бы с CSS плагинов, и низкий экран вёл бы себя
// по-разному в разных его частях.
function breakpoint(styles: string, name: string): string {
  const prefix = "$" + name + ":"
  const line = styles.split(/\r?\n/).find((row) => row.startsWith(prefix))
  const value = line?.slice(prefix.length).trim().replace(";", "")

  if (!value) {
    throw new Error(
      `[mkvs] В quartz/styles/custom.scss нет границы раскладки ${prefix.slice(0, -1)}. ` +
        "Её читает quartz.ts, чтобы перевести CSS плагинов на то же условие, " +
        "что и стили сайта (см. п.6 custom.scss). Верните переменную или " +
        "поправьте имя здесь.",
    )
  }

  return value
}

// Путь от корня сайта, а не от этого файла: перед запуском конфиг
// перекладывается в quartz/.quartz-cache/transpiled-build.mjs, и относительные
// пути «от себя» ведут не туда. Сборка Quartz и так работает от корня — по
// нему же находится и папка content.
const stylesPath = join(process.cwd(), "quartz", "styles", "custom.scss")
const customStyles = readFileSync(stylesPath, "utf8")

const narrow = breakpoint(customStyles, "mkvs-narrow")
const short = breakpoint(customStyles, "mkvs-short")

// Граница задана «включительно», поэтому обратное условие начинается со
// следующего пикселя — ровно как $columns в custom.scss.
const next = (value: string) => `${Number.parseInt(value, 10) + 1}px`

const SITE_COMPACT = `@media (max-width: ${narrow}), (max-height: ${short})`
const SITE_COLUMNS = `@media (min-width: ${next(narrow)}) and (min-height: ${next(short)})`

let patchedCss = 0

function useCompactBreakpoint(component: QuartzComponent) {
  const css = component.css
  if (css === undefined) return

  const patch = (text: string) => {
    if (!text.includes(PLUGIN_MOBILE) && !text.includes(PLUGIN_NOT_MOBILE)) return text
    patchedCss++
    return text.replaceAll(PLUGIN_NOT_MOBILE, SITE_COLUMNS).replaceAll(PLUGIN_MOBILE, SITE_COMPACT)
  }

  component.css = typeof css === "string" ? patch(css) : css.map(patch)
}

for (const pageLayout of [layout.defaults, ...Object.values(layout.byPageType)]) {
  for (const component of [
    pageLayout.head,
    pageLayout.pageBody,
    ...(pageLayout.header ?? []),
    ...(pageLayout.beforeBody ?? []),
    ...(pageLayout.afterBody ?? []),
    ...(pageLayout.left ?? []),
    ...(pageLayout.right ?? []),
    ...(pageLayout.footer ?? []),
  ]) {
    if (component) useCompactBreakpoint(component)
  }
}

if (patchedCss === 0) {
  console.warn(
    "[mkvs] Мобильный @media-запрос в CSS плагинов не найден — компактный режим " +
      "на низком экране останется без выезжающего дерева Проводника. " +
      "Сверьте PLUGIN_MOBILE в quartz.ts с тем, что отдают плагины.",
  )
}

// loadQuartzConfig() уже создал диспетчер по YAML-раскладке. Подменяем его,
// чтобы и HTML страниц, и ресурсы компонентов собирались по изменённой.
config.plugins.emitters = config.plugins.emitters.map((emitter) =>
  emitter.name === "PageTypeDispatcher" ? PageTypeDispatcher(layout) : emitter,
)
