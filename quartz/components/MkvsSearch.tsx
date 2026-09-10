import type { QuartzComponent } from "./types"
import script from "./mkvs-search.inline"

// Надстройка над плагином @quartz-community/search. Плагин ищет по странице
// целиком: в карточке результата остаётся один заголовок без пути и без числа
// совпадений, в превью подсвечены все совпадения сразу, а переход всегда ведёт
// к первому из них. Компонент приносит скрипт, который добавляет в карточку
// путь и счётчик, даёт листать совпадения в превью и открывает страницу на том
// совпадении, которое читатель смотрел. Подробности — в mkvs-search.inline.ts.
const Search: QuartzComponent = () => null

Search.displayName = "MkvsSearch"
Search.afterDOMLoaded = script
export default Search
