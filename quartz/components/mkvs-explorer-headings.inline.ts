type LabHeading = { depth: number; text: string; slug: string }

// Explorer renders asynchronously after navigation. Observe its list so this
// also works on the home page, with saved folder state, and after SPA navigation.
function installLabHeadings() {
  const data = document.querySelector<HTMLElement>("[data-mkvs-outlines]")
  if (!data) return
  const outlines: Record<string, LabHeading[]> = JSON.parse(data.dataset.mkvsOutlines ?? "{}")
  const base = (document.body.dataset.basepath ?? "").replace(/\/$/, "")

  for (const explorer of document.querySelectorAll<HTMLElement>(".explorer")) {
    const tree = explorer.querySelector<HTMLElement>(".explorer-ul")
    if (!tree) continue
    function updateCollapsedHeadings(content: HTMLElement) {
      const items = Array.from(
        content.querySelectorAll<HTMLElement>(":scope > .mkvs-heading"),
      )

      // Глубины свёрнутых родителей, внутри которых мы сейчас находимся.
      const collapsedDepths: number[] = []

      for (const item of items) {
        const depth =
          Number(item.dataset.headingDepth ?? "0")

        // Если дошли до заголовка того же или более высокого уровня,
        // предыдущая ветка закончилась.
        while (
          collapsedDepths.length > 0 &&
          depth <= collapsedDepths[collapsedDepths.length - 1]
        ) {
          collapsedDepths.pop()
        }

        const hiddenByParent = collapsedDepths.length > 0

        item.classList.toggle(
          "mkvs-heading-hidden",
          hiddenByParent,
        )

        if (item.classList.contains("mkvs-collapsed")) {
          collapsedDepths.push(depth)
        }
      }
    }
    let scrollSpyInstalled = false

    function installScrollSpy() {
      if (scrollSpyInstalled) return

      // Ищем оглавление именно открытой лабораторной работы.
      const currentFolder =
        tree!.querySelector<HTMLElement>(".folder-container.mkvs-current-lab")

      const content =
        currentFolder?.nextElementSibling?.querySelector<HTMLElement>("ul.content")

      if (!content) return

      const links = Array.from(
        content.querySelectorAll<HTMLAnchorElement>(".mkvs-heading-link"),
      )

      if (links.length === 0) return

      // Связываем ссылки Проводника с реальными заголовками в статье.
      const entries: Array<{
        link: HTMLAnchorElement
        heading: HTMLElement
      }> = []

      for (const link of links) {
        const encodedId = new URL(link.href, window.location.href).hash.slice(1)
        if (!encodedId) continue

        let id: string

        try {
          id = decodeURIComponent(encodedId)
        } catch {
          continue
        }

        const heading = document.getElementById(id)

        if (heading) {
          entries.push({ link, heading })
        }
      }

      if (entries.length === 0) return

      scrollSpyInstalled = true

      const scroller =
        explorer.querySelector<HTMLElement>(".explorer-content")

      let activeLink: HTMLAnchorElement | null = null
      let frame: number | null = null

      function keepVisible(link: HTMLAnchorElement) {
        if (!scroller) return

        const linkRect = link.getBoundingClientRect()
        const scrollerRect = scroller.getBoundingClientRect()

        const margin = 24

        if (linkRect.top < scrollerRect.top + margin) {
          scroller.scrollTop -=
            scrollerRect.top + margin - linkRect.top
        } else if (linkRect.bottom > scrollerRect.bottom - margin) {
          scroller.scrollTop +=
            linkRect.bottom - (scrollerRect.bottom - margin)
        }
      }

      function renderActivePath() {
        // Сначала снимаем старую подсветку.
        for (const entry of entries) {
          entry.link.classList.remove(
            "mkvs-active-heading",
            "mkvs-active-parent",
          )
          entry.link.removeAttribute("aria-current")
        }

        if (!activeLink) return

        activeLink.classList.add("mkvs-active-heading")
        activeLink.setAttribute("aria-current", "location")

        const activeItem =
          activeLink.closest<HTMLElement>(".mkvs-heading")

        if (!activeItem) return

        let currentDepth =
          Number(activeItem.dataset.headingDepth ?? "0")

        // Если сам активный пункт скрыт свёрнутым родителем,
        // прокручивать Проводник будем к ближайшему видимому родителю.
        let visibleLink: HTMLAnchorElement | null =
          activeItem.classList.contains("mkvs-heading-hidden")
            ? null
            : activeLink

        let sibling =
          activeItem.previousElementSibling as HTMLElement | null

        while (sibling && currentDepth > 0) {
          if (sibling.classList.contains("mkvs-heading")) {
            const siblingDepth =
              Number(sibling.dataset.headingDepth ?? "0")

            if (siblingDepth < currentDepth) {
              const parentLink =
                sibling.querySelector<HTMLAnchorElement>(
                  ":scope > .mkvs-heading-link",
                )

              if (parentLink) {
                parentLink.classList.add("mkvs-active-parent")

                if (
                  visibleLink === null &&
                  !sibling.classList.contains("mkvs-heading-hidden")
                ) {
                  visibleLink = parentLink
                }
              }

              currentDepth = siblingDepth
            }
          }

          sibling = sibling.previousElementSibling as HTMLElement | null
        }

        if (visibleLink) {
          keepVisible(visibleLink)
        }
      }

      function setActive(next: HTMLAnchorElement | null) {
        if (next === activeLink) return

        activeLink = next
        renderActivePath()
      }

      function handleCollapseChange() {
        renderActivePath()
      }

      explorer.addEventListener(
        "mkvs-heading-collapse",
        handleCollapseChange,
      )

      function update() {
        frame = null

        // Воображаемая горизонтальная линия в верхней части окна.
        // Когда заголовок проходит её, он становится текущим.
        const activationLine = Math.min(
          160,
          Math.max(80, window.innerHeight * 0.18),
        )

        let next = entries[0].link

        for (const entry of entries) {
          if (entry.heading.getBoundingClientRect().top <= activationLine) {
            next = entry.link
          } else {
            break
          }
        }

        // В самом низу страницы гарантированно выделяем последний раздел.
        const atBottom =
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 2

        if (atBottom) {
          next = entries[entries.length - 1].link
        }

        setActive(next)
      }

      function scheduleUpdate() {
        if (frame !== null) return

        frame = requestAnimationFrame(update)
      }

      window.addEventListener("scroll", scheduleUpdate, { passive: true })
      window.addEventListener("resize", scheduleUpdate)
      window.addEventListener("hashchange", scheduleUpdate)

      update()

      window.addCleanup(() => {
        window.removeEventListener("scroll", scheduleUpdate)
        window.removeEventListener("resize", scheduleUpdate)
        window.removeEventListener("hashchange", scheduleUpdate)

        explorer.removeEventListener(
          "mkvs-heading-collapse",
          handleCollapseChange,
        )

        if (frame !== null) {
          cancelAnimationFrame(frame)
        }

        setActive(null)
      })
    }

    function populate() {
      const currentLab =
        window.location.pathname.match(/\/(lab\d+)(?:\/|$)/)?.[1] ?? null

      for (const folder of tree!.querySelectorAll<HTMLElement>(
        ".folder-container[data-folderpath]",
      )) {
        const path = folder.dataset.folderpath ?? ""

        // Подсвечиваем название текущей лабораторной.
        folder.classList.toggle(
          "mkvs-current-lab",
          currentLab !== null && path === `${currentLab}/index`,
        )

        const headings = outlines[path]
        const content =
          folder.nextElementSibling?.querySelector<HTMLElement>("ul.content")

        if (!headings?.length || !content || content.querySelector(".mkvs-heading")) {
          continue
        }

        const page = `${base}/${path.replace(/index$/, "")}`

        // h2 становится уровнем 0, h3 — уровнем 1 и т.д.
        const minDepth = Math.min(...headings.map((heading) => heading.depth))

        const depths =
          headings.map((heading) => heading.depth - minDepth)

        for (let index = 0; index < headings.length; index++) {
          const heading = headings[index]
          const depth = depths[index]

          const hasChildren =
            index + 1 < headings.length &&
            depths[index + 1] > depth

          const item = document.createElement("li")
          item.className = "mkvs-heading"
          item.dataset.headingDepth = String(depth)
          item.style.setProperty("--heading-depth", String(depth))

          if (hasChildren) {
            item.classList.add("mkvs-heading-parent")

            const toggle = document.createElement("button")
            toggle.type = "button"
            toggle.className = "mkvs-heading-toggle"
            toggle.setAttribute("aria-expanded", "true")
            toggle.setAttribute(
              "aria-label",
              `Свернуть раздел «${heading.text}»`,
            )

            toggle.addEventListener("click", () => {
              const collapsed =
                item.classList.toggle("mkvs-collapsed")

              toggle.setAttribute(
                "aria-expanded",
                collapsed ? "false" : "true",
              )

              toggle.setAttribute(
                "aria-label",
                `${collapsed ? "Развернуть" : "Свернуть"} раздел «${heading.text}»`,
              )

              updateCollapsedHeadings(content)

              // Scroll-spy должен заново определить,
              // какой из подсвеченных пунктов сейчас видим.
              explorer.dispatchEvent(
                new Event("mkvs-heading-collapse"),
              )
            })

            item.append(toggle)
          } else {
            // Пустое место размером со стрелку:
            // так ссылки одного уровня остаются выровненными.
            const spacer = document.createElement("span")
            spacer.className = "mkvs-heading-toggle-spacer"
            spacer.setAttribute("aria-hidden", "true")

            item.append(spacer)
          }

          const link = document.createElement("a")
          link.className = "internal mkvs-heading-link"
          link.href =
            `${page}#${encodeURIComponent(heading.slug)}`
          link.textContent = heading.text

          item.append(link)
          content.append(item)
        }

        updateCollapsedHeadings(content)
      }

      installScrollSpy()
    }

    const observer = new MutationObserver(populate)
    observer.observe(tree, { childList: true, subtree: true })
    populate()
    window.addCleanup(() => observer.disconnect())
  }

  // Images and web fonts can change a long lab's height after SPA has scrolled.
  // Align again once layout is ready; never override subsequent user scrolling.
  const hash = window.location.hash
  if (hash) {
    let cancelled = false
    const cancel = () => { cancelled = true }
    for (const event of ["wheel", "touchstart", "keydown"]) {
      window.addEventListener(event, cancel, { passive: true, once: true })
    }
    window.addCleanup(() => {
      cancelled = true
      for (const event of ["wheel", "touchstart", "keydown"]) {
        window.removeEventListener(event, cancel)
      }
    })
    const images = Array.from(document.querySelectorAll<HTMLImageElement>("article img"))
    Promise.all([
      document.fonts.ready,
      ...images.map((image) => image.decode().catch(() => undefined)),
    ]).then(() => requestAnimationFrame(() => {
      if (cancelled || window.location.hash !== hash) return
      let id: string
      try { id = decodeURIComponent(hash.slice(1)) } catch { return }
      document.getElementById(id)?.scrollIntoView({ behavior: "instant", block: "start" })
    }))
  }
}

document.addEventListener("nav", installLabHeadings)
