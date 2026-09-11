import { scriptOnly } from "./mkvs-shared"
import script from "./mkvs-explorer.inline"

// Надстройки к Проводнику: подсветка текущей страницы вместе со всей цепочкой
// её родителей и ссылка на титульную страницу первой строкой дерева.
//
// Обе надстройки работают с одним и тем же деревом и потому приезжают одним
// скриптом с одним наблюдателем за перерисовкой. Подробности — в
// mkvs-explorer.inline.ts.
export default scriptOnly("MkvsExplorer", script)
