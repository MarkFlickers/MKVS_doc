// Состояние записи истории SPA-роутера — своя надстройка над spa.inline.ts.
//
// Модуль вынесен отдельно намеренно. spa.inline.ts — файл upstream, и роутер
// там правят регулярно: чем меньше своих строк лежит внутри него, тем
// читаемее конфликт при `git rebase upstream/v5`. Здесь — вся логика, там —
// импорт и несколько однострочных вызовов (см. README.md, «Связь с upstream»).
//
// Что хранится в записи истории:
//   scroll — позиция прокрутки страницы в момент ухода с неё;
//   depth  — сколько переходов сделано внутри сайта от точки входа.
//
// Зачем scroll: содержимое страницы при переходе «назад» подгружается
// асинхронно, и штатное восстановление прокрутки браузер успевает выполнить по
// ещё не заменённому (обычно более короткому) документу — позиция обрезается,
// и предыдущая страница открывается сначала. Поэтому после подстановки нового
// содержимого прокрутку возвращает сам роутер.
//
// Зачем depth: по нему кнопка «Назад» на странице глоссария понимает, есть ли
// куда возвращаться, — на странице, открытой по прямой ссылке, её быть не
// должно (см. mkvs-glossary-back.inline.ts).

export type SpaHistoryState = { depth?: number; scroll?: number }

export const historyState = (): SpaHistoryState => (history.state as SpaHistoryState) ?? {}

// Запоминает, где читатель остановился, пока текущая запись истории ещё
// активна: «назад» он должен вернуться на это же место.
export function saveScroll() {
  history.replaceState({ ...historyState(), scroll: window.scrollY }, "")
}

// Новая запись истории: глубина на единицу больше текущей, прокрутка с нуля.
export function pushEntry(url: URL) {
  history.pushState({ depth: (historyState().depth ?? 0) + 1, scroll: 0 }, "", url)
}

// Позиция прокрутки, записанная в состоянии события popstate.
export function scrollOf(state: unknown): number {
  return (state as SpaHistoryState | null)?.scroll ?? 0
}

// Восстановление прокрутки после подстановки нового содержимого. Второй заход
// через requestAnimationFrame — на случай, если высота страницы к этому
// моменту ещё не пересчитана и прокрутка обрезалась.
export function restoreScroll(scroll: number) {
  window.scrollTo({ top: scroll })
  requestAnimationFrame(() => window.scrollTo({ top: scroll }))
}
