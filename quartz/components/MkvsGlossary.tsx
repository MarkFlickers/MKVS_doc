import { scriptOnly } from "./mkvs-shared"
import script from "./mkvs-glossary.inline"

// Подсказки к терминам глоссария. Компонент сам ничего не рисует — он лишь
// доставляет на страницу скрипт, который перехватывает наведение на ссылки
// вида [[glossary/…]] и показывает либо строку-аннотацию, либо листаемое
// мини-окошко. Подробности — в mkvs-glossary.inline.ts.
export default scriptOnly("MkvsGlossary", script)
