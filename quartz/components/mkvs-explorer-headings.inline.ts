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

      function setActive(next: HTMLAnchorElement | null) {
        if (next === activeLink) return

        if (activeLink) {
          activeLink.classList.remove("mkvs-active-heading")
          activeLink.removeAttribute("aria-current")
        }

        activeLink = next

        if (activeLink) {
          activeLink.classList.add("mkvs-active-heading")
          activeLink.setAttribute("aria-current", "location")

          keepVisible(activeLink)
        }
      }

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

        for (const heading of headings) {
          const depth = heading.depth - minDepth

          const item = document.createElement("li")
          item.className = "mkvs-heading"
          item.dataset.headingDepth = String(depth)
          item.style.setProperty("--heading-depth", String(depth))

          const link = document.createElement("a")
          link.className = "internal mkvs-heading-link"
          link.href = `${page}#${encodeURIComponent(heading.slug)}`
          link.textContent = heading.text

          item.append(link)
          content.append(item)
        }
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
