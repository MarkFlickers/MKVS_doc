import type { QuartzComponent } from "./types"
import script from "./mkvs-search-preview.inline"

// Превью поиска: плагин прокручивает найденный фрагмент под самый верх окна
// (и делает это с ошибкой — см. mkvs-search-preview.inline.ts). Компонент
// приносит скрипт, который ставит фрагмент по центру превью.
const SearchPreview: QuartzComponent = () => null

SearchPreview.displayName = "MkvsSearchPreview"
SearchPreview.afterDOMLoaded = script
export default SearchPreview
