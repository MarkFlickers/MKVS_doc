import type { QuartzComponent } from "./types"
import script from "./mkvs-explorer-home.inline"

// Проводник показывает только то, что лежит ниже корня content, поэтому ссылки
// на титульную страницу в дереве нет. На телефоне это единственное место, где
// её можно было бы найти: название сайта из верхней панели убрано. Компонент
// приносит скрипт, который добавляет такую ссылку первой строкой дерева.
const ExplorerHome: QuartzComponent = () => null

ExplorerHome.displayName = "MkvsExplorerHome"
ExplorerHome.afterDOMLoaded = script
export default ExplorerHome
