import type { QuartzComponent } from "./types"
import script from "./mkvs-sidebar-toggle.inline"
import prescript from "./mkvs-sidebar-state.inline"

// Кнопка сворачивания левой колонки для ПК — в верхней панели области текста,
// рядом с переключателем темы. Держать её в самой колонке нельзя: после
// сворачивания она уехала бы вместе с колонкой.
//
// Иконка — тот же «гамбургер» (lucide-menu), что у штатной кнопки Проводника
// в Quartz (.mobile-explorer). На узком экране эта кнопка скрыта (см.
// custom.scss): там колонка превращается в верхнюю панель, и Проводник
// сворачивает штатная кнопка Quartz. Итого на любой ширине пользователь видит
// ровно один «гамбургер» и он всегда работает.
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
      class="lucide-menu"
      aria-hidden="true"
    >
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  </button>
)

SidebarToggle.displayName = "MkvsSidebarToggle"
SidebarToggle.beforeDOMLoaded = prescript
SidebarToggle.afterDOMLoaded = script
export default SidebarToggle
