// Подсказки к терминам глоссария.
//
// В текстах лабораторных работ термины размечены обычными ссылками вида
// [[glossary/cmsis|CMSIS]]. Штатный механизм Quartz показал бы для них
// popover — то же мини-окно, что и для ссылок в списке страниц работы.
// Для одной-двух фраз это слишком громоздко, поэтому вид подсказки
// выбирается по содержимому статьи глоссария:
//
//   * на странице только определение (один абзац) — показывается
//     строка-аннотация;
//   * на странице есть продолжение — показывается листаемое мини-окошко со
//     всей статьёй.
//
// Мини-окошко намеренно собирается из тех же классов .popover/.popover-inner,
// что и штатное: так подсказка к термину и подсказка к ссылке выглядят
// одинаково, а правило .popover:hover из popover.scss позволяет увести
// указатель внутрь окошка и прокрутить его.
//
// Штатный обработчик отключается атрибутом data-no-popover: popover.inline.ts
// проверяет его в начале своего mouseenter.

import { computePosition, flip, inline, shift } from "@floating-ui/dom"
import { normalizeRelativeURLs } from "../util/path"
import { fetchCanonical } from "./scripts/util"

type Entry = { kind: "hint"; html: string } | { kind: "card"; title: string; html: string }

const parser = new DOMParser()

// Статья глоссария разбирается один раз за загрузку страницы. Ключ — путь,
// поэтому один термин, размеченный в тексте несколько раз, тянет одну загрузку.
const entries = new Map<string, Promise<Entry | null>>()

let activeLink: HTMLAnchorElement | null = null

async function readEntry(url: URL): Promise<Entry | null> {
  const response = await fetchCanonical(url).catch(() => null)
  if (!response || !response.headers.get("Content-Type")?.startsWith("text/html")) return null

  const doc = parser.parseFromString(await response.text(), "text/html")
  normalizeRelativeURLs(doc, url)
  // Идентификаторы заголовков статьи не должны совпадать с идентификаторами
  // на самой странице — иначе якорные ссылки начнут вести в подсказку.
  doc.querySelectorAll("[id]").forEach((el) => (el.id = `glossary-internal-${el.id}`))

  const article = doc.querySelector("article")
  const root = article?.querySelector(".markdown-rendered") ?? article
  if (!root) return null

  const blocks = Array.from(root.children)
  if (blocks.length === 0) return null

  // Определение и есть весь текст статьи — значит подсказка укладывается в строку.
  if (blocks.length === 1 && blocks[0].tagName === "P") {
    return { kind: "hint", html: blocks[0].innerHTML }
  }

  const title = doc.querySelector("h1.article-title")?.textContent?.trim() ?? ""
  return { kind: "card", title, html: root.innerHTML }
}

function build(id: string, entry: Entry): HTMLElement {
  const box = document.createElement("div")
  box.id = id

  if (entry.kind === "hint") {
    box.className = "glossary-hint"
    const inner = document.createElement("div")
    inner.className = "glossary-hint-inner"
    inner.innerHTML = entry.html
    box.appendChild(inner)
    return box
  }

  // Те же классы, что у штатного popover: и вид, и прокрутка достаются даром.
  box.className = "popover glossary-popover"
  const inner = document.createElement("div")
  inner.className = "popover-inner"
  if (entry.title) {
    const heading = document.createElement("h1")
    heading.textContent = entry.title
    inner.appendChild(heading)
  }
  const content = document.createElement("div")
  content.innerHTML = entry.html
  inner.appendChild(content)
  box.appendChild(inner)
  return box
}

async function place(link: HTMLAnchorElement, box: HTMLElement, x: number, y: number) {
  const { x: left, y: top } = await computePosition(link, box, {
    strategy: "fixed",
    middleware: [inline({ x, y }), shift(), flip()],
  })
  box.style.transform = `translate(${left.toFixed()}px, ${top.toFixed()}px)`
}

function hideAll() {
  activeLink = null
  document
    .querySelectorAll(".glossary-popover.active-popover, .glossary-hint.active-hint")
    .forEach((box) => box.classList.remove("active-popover", "active-hint"))
}

async function onEnter(this: HTMLAnchorElement, { clientX, clientY }: MouseEvent) {
  const link = (activeLink = this)
  const url = new URL(link.href)
  url.hash = ""
  url.search = ""

  const id = `glossary-${url.pathname}`
  let box = document.getElementById(id)

  if (!box) {
    let pending = entries.get(id)
    if (!pending) {
      pending = readEntry(url)
      entries.set(id, pending)
    }
    const entry = await pending
    if (!entry) return
    // Пока шла загрузка, указатель мог уйти на другой термин.
    if (activeLink !== link) return
    box = document.getElementById(id)
    if (!box) {
      box = build(id, entry)
      document.body.appendChild(box)
    }
  }

  hideAll()
  activeLink = link
  box.classList.add(box.classList.contains("glossary-hint") ? "active-hint" : "active-popover")
  place(link, box, clientX, clientY)
}

function installGlossary() {
  // Только текст статьи: списки страниц, обратные ссылки и Проводник ссылаются
  // на глоссарий как на обычные страницы, подчёркивать их термином незачем.
  // Ссылку на сам указатель глоссария тоже оставляем обычной.
  const links = document.querySelectorAll<HTMLAnchorElement>(
    'article a.internal[data-slug^="glossary/"]:not([data-slug="glossary/index"])',
  )

  for (const link of links) {
    link.classList.add("glossary-term")
    // Штатный popover для этих ссылок не нужен — вид подсказки выбираем сами.
    link.dataset.noPopover = "true"

    link.addEventListener("mouseenter", onEnter)
    link.addEventListener("mouseleave", hideAll)
    window.addCleanup(() => {
      link.removeEventListener("mouseenter", onEnter)
      link.removeEventListener("mouseleave", hideAll)
    })
  }

  // Подсказки живут в document.body и переход на другую страницу их не трогает.
  window.addCleanup(() => {
    document.querySelectorAll(".glossary-popover, .glossary-hint").forEach((box) => box.remove())
    entries.clear()
    activeLink = null
  })
}

document.addEventListener("nav", installGlossary)

// Про строку ниже — README.md, раздел «Инлайн-скрипты».
export default ""
