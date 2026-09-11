// Кнопка «Назад к тексту» на статье глоссария. Разметка — MkvsGlossaryBack.tsx.
//
// Показываем кнопку только тогда, когда возвращаться действительно есть куда:
// depth в состоянии записи истории ведёт SPA-роутер (spa.inline.ts, логика —
// scripts/mkvs-spa-history.ts) и считает переходы от точки входа на сайт. На
// странице, открытой по прямой ссылке или из поисковика, depth нет — кнопка
// остаётся скрытой.
//
// Дальше всё делает history.back(): роутер сам восстановит позицию прокрутки
// на предыдущей странице, поэтому читатель возвращается ровно к тому месту,
// откуда ушёл за определением.
//
// Скрипт лежит отдельно от mkvs-glossary.inline.ts намеренно: к подсказкам
// к терминам он отношения не имеет, а зависит от роутера. Раньше он жил
// внутри скрипта глоссария, и, открыв MkvsGlossaryBack.tsx, до его поведения
// было не добраться.

import { historyState } from "./scripts/mkvs-spa-history"

function installGlossaryBack() {
  const box = document.querySelector<HTMLElement>(".mkvs-glossary-back")
  const button = box?.querySelector("button")
  if (!box || !button) return

  if ((historyState().depth ?? 0) <= 0) return

  // Скрыта обёртка целиком: пустая, она всё равно занимала бы в панели строку.
  box.hidden = false

  const onClick = () => history.back()
  button.addEventListener("click", onClick)
  window.addCleanup(() => button.removeEventListener("click", onClick))
}

document.addEventListener("nav", installGlossaryBack)

// Про строку ниже — README.md, раздел «Инлайн-скрипты».
export default ""
