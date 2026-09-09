import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
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

// loadQuartzConfig() уже создал диспетчер по YAML-раскладке. Подменяем его,
// чтобы и HTML страниц, и ресурсы компонентов собирались по изменённой.
config.plugins.emitters = config.plugins.emitters.map((emitter) =>
  emitter.name === "PageTypeDispatcher" ? PageTypeDispatcher(layout) : emitter,
)
