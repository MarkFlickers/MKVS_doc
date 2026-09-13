import { scriptOnly } from "./mkvs-shared"
import script from "./mkvs-explorer.inline"

// Надстройки к Проводнику: подсветка текущей страницы вместе со всей цепочкой
// её родителей, ссылка на титульную страницу первой строкой дерева и
// сворачивание работы нажатием на всю полосу слева от её названия.
//
// Все три работают с одним и тем же деревом и потому приезжают одним
// скриптом. Подробности — в mkvs-explorer.inline.ts.
export default scriptOnly("MkvsExplorer", script)
