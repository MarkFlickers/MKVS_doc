// Сворачивание разделов и подсветка текущего раздела в оглавлении справа.
//
// Штатный плагин @quartz-community/table-of-contents рендерит плоский список:
//   <ul class="toc-content overflow">
//     <li class="depth-0"><a href="#основная-часть" data-for="основная-часть">…</a></li>
//     <li class="depth-1"><a href="#часть-1-…">…</a></li>
//     …
//     <li class="overflow-end"></li>
//   </ul>
// Вложенность закодирована только классом depth-N. Скрипт восстанавливает по
// нему иерархию, добавляет пунктам с подпунктами кнопку-стрелку и следит за
// прокруткой, подсвечивая текущий раздел — как в оглавлении книжной темы.
// Сам список плагина не переписывается: если плагин обновится, оглавление
// продолжит работать, а надстройка просто не найдёт, за что зацепиться.

// Стартовое состояние подпунктов. true — при открытии страницы видны только
// разделы верхнего уровня, а ветка текущего раздела раскрывается сама.
const COLLAPSED_BY_DEFAULT = true

type TocItem = {
  li: HTMLLIElement
  link: HTMLAnchorElement
  depth: number
  slug: string
}

function setupToc(list: HTMLElement) {
  const items: TocItem[] = []

  for (const li of Array.from(list.children) as HTMLElement[]) {
    const depth = li.className.match(/(?:^|\s)depth-(\d+)(?:\s|$)/)
    // Служебный <li class="overflow-end"> в конце списка пропускаем.
    if (!depth) continue
    const link = li.querySelector<HTMLAnchorElement>("a[data-for]")
    if (!link) continue
    items.push({
      li: li as HTMLLIElement,
      link,
      depth: Number(depth[1]),
      slug: link.dataset.for ?? "",
    })
  }

  if (items.length === 0) return

  // Пункт с подпунктами — тот, за которым сразу идёт пункт глубже уровнем.
  const hasChildren = (index: number) =>
    index + 1 < items.length && items[index + 1].depth > items[index].depth

  // Индексы всех родителей пункта, снизу вверх.
  function ancestorsOf(index: number): number[] {
    const result: number[] = []
    let depth = items[index].depth
    for (let i = index - 1; i >= 0 && depth > 0; i--) {
      if (items[i].depth < depth) {
        result.push(i)
        depth = items[i].depth
      }
    }
    return result
  }

  // Разделы, которые читатель свернул или развернул сам. Их состояние
  // прокрутка не трогает — иначе оглавление спорило бы с читателем.
  const manual = new Set<number>()

  function setToggleState(index: number) {
    const item = items[index]
    const toggle = item.li.querySelector<HTMLButtonElement>(".mkvs-toc-toggle")
    if (!toggle) return
    const collapsed = item.li.classList.contains("mkvs-toc-collapsed")
    const title = item.link.textContent ?? ""
    toggle.setAttribute("aria-expanded", collapsed ? "false" : "true")
    toggle.setAttribute("aria-label", `${collapsed ? "Развернуть" : "Свернуть"} раздел «${title}»`)
  }

  // Пересчитывает видимость всех пунктов: пункт скрыт, если хотя бы один из
  // его родителей свёрнут. Считаем одним проходом сверху вниз, храня стек
  // глубин свёрнутых родителей.
  function applyVisibility() {
    const collapsedDepths: number[] = []

    for (const item of items) {
      while (
        collapsedDepths.length > 0 &&
        item.depth <= collapsedDepths[collapsedDepths.length - 1]
      ) {
        collapsedDepths.pop()
      }

      item.li.classList.toggle("mkvs-toc-hidden", collapsedDepths.length > 0)

      if (item.li.classList.contains("mkvs-toc-collapsed")) {
        collapsedDepths.push(item.depth)
      }
    }
  }

  for (let index = 0; index < items.length; index++) {
    const item = items[index]
    item.li.classList.add("mkvs-toc-item")

    if (!hasChildren(index)) {
      // Пустое место шириной со стрелку, чтобы ссылки одного уровня
      // оставались выровненными по левому краю.
      const spacer = document.createElement("span")
      spacer.className = "mkvs-toc-spacer"
      spacer.setAttribute("aria-hidden", "true")
      item.li.prepend(spacer)
      continue
    }

    item.li.classList.add("mkvs-toc-parent")
    if (COLLAPSED_BY_DEFAULT) {
      item.li.classList.add("mkvs-toc-collapsed")
    }

    const toggle = document.createElement("button")
    toggle.type = "button"
    toggle.className = "mkvs-toc-toggle"

    const onClick = () => {
      item.li.classList.toggle("mkvs-toc-collapsed")
      manual.add(index)
      setToggleState(index)
      applyVisibility()
    }

    toggle.addEventListener("click", onClick)
    window.addCleanup(() => toggle.removeEventListener("click", onClick))

    item.li.prepend(toggle)
    setToggleState(index)
  }

  // --- подсветка текущего раздела ------------------------------------------

  const headings = items.map((item) => document.getElementById(item.slug))
  let active = -1

  function setActive(next: number) {
    if (next === active) return
    active = next

    const path = new Set<number>(next >= 0 ? [next, ...ancestorsOf(next)] : [])

    for (let index = 0; index < items.length; index++) {
      const item = items[index]
      item.link.classList.toggle("mkvs-toc-active", index === next)
      item.link.classList.toggle("mkvs-toc-active-parent", index !== next && path.has(index))

      // Ветка текущего раздела раскрывается, соседние сворачиваются обратно.
      // Разделы, которые читатель открыл или закрыл руками, не трогаем.
      if (item.li.classList.contains("mkvs-toc-parent") && !manual.has(index)) {
        item.li.classList.toggle("mkvs-toc-collapsed", COLLAPSED_BY_DEFAULT && !path.has(index))
        setToggleState(index)
      }
    }

    applyVisibility()
  }

  let frame: number | null = null

  function update() {
    frame = null

    // Воображаемая горизонтальная линия в верхней части окна: заголовок,
    // прошедший её последним, и считается текущим.
    const activationLine = Math.min(160, Math.max(80, window.innerHeight * 0.18))

    let next = 0
    for (let index = 0; index < items.length; index++) {
      const heading = headings[index]
      if (!heading) continue
      if (heading.getBoundingClientRect().top <= activationLine) next = index
      else break
    }

    // В самом низу страницы гарантированно подсвечиваем последний раздел.
    const atBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
    if (atBottom) next = items.length - 1

    setActive(next)
  }

  function scheduleUpdate() {
    if (frame !== null) return
    frame = requestAnimationFrame(update)
  }

  window.addEventListener("scroll", scheduleUpdate, { passive: true })
  window.addEventListener("resize", scheduleUpdate)
  window.addEventListener("hashchange", scheduleUpdate)
  window.addCleanup(() => {
    window.removeEventListener("scroll", scheduleUpdate)
    window.removeEventListener("resize", scheduleUpdate)
    window.removeEventListener("hashchange", scheduleUpdate)
    if (frame !== null) cancelAnimationFrame(frame)
  })

  applyVisibility()
  update()
}

function installTocCollapse() {
  for (const list of document.querySelectorAll<HTMLElement>("ul.toc-content")) {
    if (list.dataset.mkvsCollapsible === "true") continue
    list.dataset.mkvsCollapsible = "true"
    setupToc(list)
  }
}

document.addEventListener("nav", installTocCollapse)
// Оглавление может быть перерисовано и без навигации (событие render).
// Повторный проход безопасен: уже обработанный список помечен data-атрибутом.
document.addEventListener("render", installTocCollapse)

// Про строку ниже — README.md, раздел «Инлайн-скрипты».
export default ""
