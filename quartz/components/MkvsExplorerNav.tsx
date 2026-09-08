import type { QuartzComponent } from "./types"
import script from "./mkvs-explorer-nav.inline"

// Проводник Quartz помечает классом active только файловые узлы. Страница
// лабораторной работы — это content/labNN/index.md, то есть в дереве она
// папка, и подсветки не получает; родительские папки не подсвечиваются
// вообще. Компонент приносит скрипт, который отмечает текущую страницу и всю
// цепочку её родителей — как в книжной навигации.
const ExplorerNav: QuartzComponent = () => null

ExplorerNav.displayName = "MkvsExplorerNav"
ExplorerNav.afterDOMLoaded = script
export default ExplorerNav
