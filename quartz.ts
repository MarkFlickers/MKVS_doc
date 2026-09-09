import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { PageTypeDispatcher } from "./quartz/plugins/pageTypes/dispatcher"
import TocCollapse from "./quartz/components/MkvsTocCollapse"
import ExplorerNav from "./quartz/components/MkvsExplorerNav"
import SearchPreview from "./quartz/components/MkvsSearchPreview"
import SidebarToggle from "./quartz/components/MkvsSidebarToggle"
import Glossary from "./quartz/components/MkvsGlossary"

const config = await loadQuartzConfig()
export default config
export const layout = await loadQuartzLayout()

// Штатные компоненты Quartz дополняются тремя своими надстройками.
// Все они ничего не меняют в самих плагинах — только добавляют поведение
// поверх готовой разметки, чтобы обновление плагинов ничего не ломало.
for (const pageLayout of [layout.defaults, ...Object.values(layout.byPageType)]) {
  // Кнопка сворачивания левой колонки — первой в верхней панели,
  // левее переключателя темы (он приходит из конфига с priority 20).
  if (pageLayout.header?.length && !pageLayout.header.includes(SidebarToggle)) {
    pageLayout.header = [SidebarToggle, ...pageLayout.header]
  }

  // Подсветка текущей страницы и её родителей в Проводнике и центрирование
  // найденного фрагмента в превью поиска — обе надстройки к левой колонке.
  if (pageLayout.left?.length && !pageLayout.left.includes(ExplorerNav)) {
    pageLayout.left = [...pageLayout.left, ExplorerNav, SearchPreview]
  }

  // Сворачивание разделов и подсветка текущего раздела в оглавлении.
  if (pageLayout.right?.length && !pageLayout.right.includes(TocCollapse)) {
    pageLayout.right = [...pageLayout.right, TocCollapse]
  }

  // Подсказки к терминам глоссария. Скрипт нужен в теле любой страницы, а не
  // только там, где есть боковые колонки, поэтому компонент добавляется в
  // afterBody — он присутствует во всех раскладках.
  if (!pageLayout.afterBody?.includes(Glossary)) {
    pageLayout.afterBody = [...(pageLayout.afterBody ?? []), Glossary]
  }
}

// loadQuartzConfig() уже создал диспетчер по YAML-раскладке. Подменяем его,
// чтобы и HTML страниц, и ресурсы компонентов собирались по изменённой.
config.plugins.emitters = config.plugins.emitters.map((emitter) =>
  emitter.name === "PageTypeDispatcher" ? PageTypeDispatcher(layout) : emitter,
)
