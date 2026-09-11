import type { QuartzComponent, QuartzComponentProps } from "./types"
import script from "./mkvs-glossary-back.inline"

// Кнопка «Назад» на статье глоссария.
//
// Термины размечены ссылками из текстов работ, и после чтения определения
// читатель почти всегда возвращается туда, откуда пришёл. Штатной кнопкой
// браузера это делалось плохо: SPA-роутер Quartz не восстанавливал прокрутку,
// и предыдущая страница открывалась сначала. Восстановление позиции добавлено
// в spa.inline.ts, а эта кнопка просто вызывает history.back() — то есть даёт
// то же самое, но под рукой и на ПК, и на телефоне.
//
// Компонент живёт в верхней панели (header) вместе с кнопками Проводника и
// темы, поэтому кнопка закреплена на экране и доступна в любой момент чтения,
// а не только в начале статьи. Обёртка нужна для раскладки: она занимает в
// панели отдельную строку — под кнопкой Проводника (см. custom.scss).
//
// Кнопка выводится только на статьях глоссария (не на указателе терминов) и
// скрыта до тех пор, пока скрипт не убедится, что переход был сделан внутри
// сайта: на странице, открытой по прямой ссылке, возвращаться некуда.
// Сам скрипт — mkvs-glossary-back.inline.ts.
const GlossaryBack: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const slug = fileData.slug ?? ""
  if (!slug.startsWith("glossary/") || slug === "glossary/index") return null

  return (
    <div class="mkvs-glossary-back" hidden>
      <button type="button">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M19 12H5" />
          <path d="m12 19-7-7 7-7" />
        </svg>
        Назад к тексту
      </button>
    </div>
  )
}

GlossaryBack.displayName = "MkvsGlossaryBack"
GlossaryBack.afterDOMLoaded = script
export default GlossaryBack
