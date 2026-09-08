import type { QuartzComponent } from "./types"
import script from "./mkvs-toc-collapse.inline"

// Штатное оглавление (@quartz-community/table-of-contents) рендерит плоский
// список <li class="depth-N"> без вложенности и без сворачивания.
// Компонент сам ничего не рисует — он лишь доставляет на страницу скрипт,
// который навешивает на этот список стрелки «свернуть/развернуть».
// Так само оглавление остаётся штатным, а сворачивание — надстройкой над ним.
const TocCollapse: QuartzComponent = () => null

TocCollapse.displayName = "MkvsTocCollapse"
TocCollapse.afterDOMLoaded = script
export default TocCollapse
