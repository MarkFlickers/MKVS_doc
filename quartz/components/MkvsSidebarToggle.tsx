import type { QuartzComponent } from "./types"
import script from "./mkvs-sidebar-toggle.inline"
import prescript from "./mkvs-sidebar-state.inline"

// Кнопка сворачивания левой колонки — в верхней панели области текста,
// рядом с переключателем темы. Держать её в самой колонке нельзя: после
// сворачивания она уехала бы вместе с колонкой.
//
// Состояние хранится атрибутом data-left-sidebar на <html> (его же читает
// раскладка в custom.scss) и запоминается в localStorage. Атрибут ставится
// заранее скриптом из prescript.js, поэтому при загрузке страницы колонка
// не успевает мигнуть.
const SidebarToggle: QuartzComponent = () => (
  <button
    type="button"
    class="mkvs-sidebar-toggle"
    aria-controls="quartz-body"
    aria-expanded="true"
    aria-label="Скрыть панель навигации"
    title="Скрыть панель навигации"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <polyline points="11 17 6 12 11 7" />
      <polyline points="18 17 13 12 18 7" />
    </svg>
  </button>
)

SidebarToggle.displayName = "MkvsSidebarToggle"
SidebarToggle.beforeDOMLoaded = prescript
SidebarToggle.afterDOMLoaded = script
export default SidebarToggle
