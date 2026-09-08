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
