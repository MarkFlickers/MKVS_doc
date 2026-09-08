// Центрирование найденного фрагмента в превью поиска.
//
// Что делает плагин @quartz-community/search. После вставки содержимого
// страницы в .preview-container он прокручивает превью так:
//
//   for (; ft && ft !== h; ) { Nt += ft.offsetTop; ft = ft.offsetParent }
//   h.scrollTop = Math.max(0, Nt - 50)
//
// то есть суммирует offsetTop по цепочке offsetParent до .preview-container.
// Но .preview-container не позиционирован, поэтому offsetParent его
// проскакивает и цепочка упирается в .search-container (он position: fixed).
// В смещение попадает высота строки поиска, превью прокручивается слишком
// далеко, и совпадение уходит ВЫШЕ видимой области.
//
// Правило position: relative в custom.scss лечит саму арифметику плагина, а
// этот скрипт ставит фрагмент по центру превью вместо 50px от верхнего края.
//
// Порядок важен: плагин регистрирует свой requestAnimationFrame сразу после
// вставки содержимого, а мы — из колбэка наблюдателя, то есть позже в том же
// кадре. Значит наша прокрутка применяется последней, и рывка не видно.

function bestHighlight(container: HTMLElement): HTMLElement | null {
  const highlights = Array.from(container.querySelectorAll<HTMLElement>(".highlight"))
  if (highlights.length === 0) return null
  // Плагин выбирает самое длинное совпадение — берём то же, чтобы прокрутка
  // и подсветка указывали на одно и то же место.
  highlights.sort((a, b) => b.innerHTML.length - a.innerHTML.length)
  return highlights[0]
}

function installSearchPreview() {
  for (const layout of document.querySelectorAll<HTMLElement>(".search-layout")) {
    if (layout.dataset.mkvsPreviewCentered === "true") continue
    layout.dataset.mkvsPreviewCentered = "true"

    // Прокрутку, которую сделали сами, отличаем от пользовательской по
    // позиции: событие scroll приходит асинхронно, и флагом это не поймать.
    let lastSet = -1
    let userScrolled = false
    let pending: number | null = null

    function center(container: HTMLElement) {
      const target = bestHighlight(container)
      if (!target) return

      // Считаем через getBoundingClientRect, а не через offsetTop: результат
      // не зависит от того, какие предки позиционированы.
      const box = container.getBoundingClientRect()
      const mark = target.getBoundingClientRect()
      const delta = mark.top - box.top - (box.height - mark.height) / 2

      container.scrollTop = Math.max(0, container.scrollTop + delta)
      lastSet = container.scrollTop
    }

    function schedule() {
      const container = layout.querySelector<HTMLElement>(".preview-container")
      if (!container) return
      if (pending !== null) cancelAnimationFrame(pending)
      pending = requestAnimationFrame(() => {
        pending = null
        center(container)
      })
    }

    const observer = new MutationObserver((records) => {
      // Превью пересобрано — читатель ещё ничего в нём не прокручивал.
      const rebuilt = records.some((record) =>
        Array.from(record.addedNodes).some(
          (node) => node instanceof HTMLElement && node.classList.contains("preview-inner"),
        ),
      )
      if (rebuilt) userScrolled = false
      if (rebuilt || !userScrolled) schedule()
    })
    observer.observe(layout, { childList: true, subtree: true })

    // Картинки статьи догружаются уже после вставки и сдвигают содержимое.
    // Событие load не всплывает, поэтому слушаем на фазе перехвата. Если
    // читатель успел прокрутить превью сам, больше не вмешиваемся.
    const onLoad = () => {
      if (!userScrolled) schedule()
    }
    layout.addEventListener("load", onLoad, true)

    const onScroll = () => {
      const container = layout.querySelector<HTMLElement>(".preview-container")
      if (!container || container.scrollTop === lastSet) return
      userScrolled = true
    }
    layout.addEventListener("scroll", onScroll, true)

    window.addCleanup(() => {
      observer.disconnect()
      layout.removeEventListener("load", onLoad, true)
      layout.removeEventListener("scroll", onScroll, true)
      if (pending !== null) cancelAnimationFrame(pending)
    })
  }
}

document.addEventListener("nav", installSearchPreview)

// Строка ниже нужна только компилятору: MkvsSearchPreview.tsx импортирует этот
// файл как текст скрипта, и без экспорта по умолчанию tsc ругается TS2306.
// Загрузчик inline-script-loader (quartz/cli/handlers.js) вырезает эту
// конструкцию перед сборкой, поэтому в браузер она не попадает.
//
// ВАЖНО: загрузчик ищет её простым поиском подстроки по всему файлу, так что
// упоминать её текстом в комментариях выше нельзя — вырежется комментарий,
// а сама строка останется и сломает сборку.
export default ""
