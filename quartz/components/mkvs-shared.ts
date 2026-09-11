import type { QuartzComponent } from "./types"

// Компонент, который ничего не рисует, а только доставляет скрипт на страницу.
//
// Почти все свои надстройки устроены именно так: разметка уже есть — её отдал
// плагин Quartz, — и нужно лишь добавить поверх поведение. Раскладка страницы
// собирается из компонентов, поэтому и скрипт приезжает компонентом.
//
// Три строки на такой компонент (`() => null`, displayName, afterDOMLoaded)
// повторялись в шести файлах дословно. Здесь они один раз, а в файле остаётся
// то единственное, ради чего его открывают, — комментарий о том, что именно
// надстройка делает и почему.
//
// prescript попадает в <head> и выполняется ДО отрисовки страницы. Он нужен
// там, где иначе видно мигание: например, состояние свёрнутой колонки надо
// поставить на <html> до первой отрисовки.
export function scriptOnly(
  displayName: string,
  script: string,
  prescript?: string,
): QuartzComponent {
  const component: QuartzComponent = () => null
  component.displayName = displayName
  component.afterDOMLoaded = script
  if (prescript !== undefined) component.beforeDOMLoaded = prescript
  return component
}
