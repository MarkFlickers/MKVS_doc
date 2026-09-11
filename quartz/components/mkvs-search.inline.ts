// Поиск: путь и число совпадений в карточке результата, листание совпадений в
// превью и переход ровно к тому совпадению, которое читатель смотрел.
//
// Что делает плагин @quartz-community/search сам:
//   • ищет по странице целиком — в индексе FlexSearch один документ на файл,
//     разделов и якорей там нет;
//   • в карточке результата показывает только заголовок страницы и ОДИН
//     фрагмент: окно в 60 слов вокруг самого плотного скопления совпадений
//     (на широком экране этот фрагмент вдобавок спрятан его собственным CSS —
//     display: none, см. styles/mkvs/_search.scss);
//   • в превью справа подсвечивает ВСЕ совпадения, но прокручивает окно к
//     самому длинному из них и никак не показывает, сколько их всего;
//   • по клику кладёт запрос в sessionStorage['search-term'], а на открытой
//     странице прокручивает к ПЕРВОМУ вхождению — перебирая сначала все
//     заголовки и только потом абзацы, независимо от того, что читатель
//     листал в превью.
//
// Скрипт ничего не меняет в плагине, а дополняет его разметку:
//   1) в карточку добавляется путь («Лабораторная работа 02») и число
//      совпадений в файле;
//   2) над превью появляется панель «‹ 3 / 12 ›»: активное совпадение
//      подсвечено ярче, стрелки и Alt+↑/↓ листают совпадения по кругу, а
//      выбранное совпадение держится, пока не сменится запрос;
//   3) при переходе запоминается номер активного совпадения, и на открытой
//      странице подсветка ставится именно на него.
//
// Ключевое требование: нумерация совпадений в превью и на самой странице
// обязана совпадать. Поэтому совпадения и там, и там ищутся ОДНИМ И ТЕМ ЖЕ
// способом — обходом текстовых узлов внутри .popover-hint тем же регулярным
// выражением, которое строит плагин (terms() в scripts/mkvs-search-query.ts).
//
// Здесь осталась только сборка. Сами части — в scripts/:
//
//   mkvs-search-query.ts    разбор запроса и регулярное выражение плагина;
//   mkvs-search-matches.ts  поиск совпадений в тексте и загрузка страниц;
//   mkvs-search-cards.ts    путь и счётчик в карточке результата;
//   mkvs-search-preview.ts  панель «‹ 3 / 12 ›» и листание совпадений;
//   mkvs-search-jump.ts     перенос активного совпадения на открытую страницу.

import { termOf } from "./scripts/mkvs-search-query"
import { decorateCards } from "./scripts/mkvs-search-cards"
import { installPreview, step } from "./scripts/mkvs-search-preview"
import { applyJump, remember, takeJump } from "./scripts/mkvs-search-jump"

// ---------------------------------------------------------------------------
// Установка
// ---------------------------------------------------------------------------

function installSearch() {
  for (const search of document.querySelectorAll<HTMLElement>(".search")) {
    const layout = search.querySelector<HTMLElement>(".search-layout")
    const results = search.querySelector<HTMLElement>(".results-container")
    const input = search.querySelector<HTMLInputElement>(".search-bar")
    if (!layout || !input) continue
    if (layout.dataset.mkvsSearch === "true") continue
    layout.dataset.mkvsSearch = "true"

    installPreview(layout)

    // Список результатов плагин создаёт сам при первом открытии окна поиска,
    // поэтому наблюдаем за раскладкой целиком, а не только за списком.
    const target = results ?? layout
    const cards = new MutationObserver(() => {
      const container = layout.querySelector<HTMLElement>(".results-container")
      if (container) decorateCards(container, termOf(input))
    })
    cards.observe(target, { childList: true, subtree: true })

    // Клик по карточке и Enter на выделенной карточке — два разных пути в
    // плагине. Оба ловятся на фазе перехвата: по Enter плагин успевает
    // закрыть окно поиска и очистить список ДО того, как сработает ссылка.
    const onClick = (event: MouseEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      const card = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>(".result-card")
      if (!card || card.classList.contains("no-match")) return
      remember(card, input)
    }
    document.addEventListener("click", onClick, true)

    const onKeyDown = (event: KeyboardEvent) => {
      // Клавиши перехватываются только при открытом окне поиска: Alt+стрелки
      // за его пределами принадлежат браузеру (это переход по истории).
      const open = search.querySelector(".search-container.active") !== null
      if (!open) return

      if (event.altKey && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
        // Стрелки без Alt плагин тратит на перебор результатов, поэтому
        // совпадения листаются с Alt. Событие до плагина не доводим.
        event.preventDefault()
        event.stopPropagation()
        step(layout, event.key === "ArrowDown" ? 1 : -1)
        return
      }
      if (event.key !== "Enter" || event.isComposing) return
      // Открытый список подсказок по тегам забирает Enter себе — перехода не
      // будет.
      const tags = search.querySelector<HTMLElement>(".tag-suggestions")
      if (tags && tags.style.display !== "none" && tags.querySelector(".active")) return
      const card = layout.querySelector<HTMLAnchorElement>(".result-card.focus")
      if (card) remember(card, input)
    }
    document.addEventListener("keydown", onKeyDown, true)

    window.addCleanup(() => {
      cards.disconnect()
      document.removeEventListener("click", onClick, true)
      document.removeEventListener("keydown", onKeyDown, true)
    })
  }

  const jump = takeJump()
  if (!jump) return

  // Штатный переход плагина к ПЕРВОМУ вхождению отменяем, забрав у него запрос.
  //
  // Момент выбран не случайно. Плагин читает sessionStorage в самом конце
  // своего обработчика nav — после того, как загрузит FlexSearch и построит
  // индекс, то есть за двумя await. Мы же удаляем ключ ЗДЕСЬ И СЕЙЧАС,
  // синхронно внутри того же события nav, и порядок обработчиков роли не
  // играет: любой await отдаёт управление нам.
  //
  // Поправить его прокрутку задним числом не выйдет: при переходе по Enter
  // плагин закрывает окно поиска до щелчка по ссылке, страница из-за этого
  // перезагружается целиком, и его подсветка встаёт на секунду позже нашей —
  // на странице оказались бы две подсветки, и его прокрутка легла бы поверх.
  //
  // Если записи о переходе нет (обычный переход по ссылке, чужая вкладка),
  // ключ не трогаем — поиск ведёт себя ровно как без надстройки.
  try {
    sessionStorage.removeItem("search-term")
  } catch {
    // Приватный режим браузера — читать там было всё равно нечего.
  }

  // Двойной кадр: к этому времени страница успевает встать на место после
  // перехода, и прокрутка к совпадению не спорит с восстановлением позиции.
  requestAnimationFrame(() => requestAnimationFrame(() => applyJump(jump)))
}

document.addEventListener("nav", installSearch)

// Про строку ниже — README.md, раздел «Инлайн-скрипты».
export default ""
