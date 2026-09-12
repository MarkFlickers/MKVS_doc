import type { Root } from "hast"
import { htmlToJsx } from "../util/jsx"
import type { FileTrieNode } from "../util/fileTrie"
import { trieFromAllFiles, type BuildTimeTrieData } from "../util/ctx"
import { resolveRelative, type FilePath, type FullSlug } from "../util/path"
import { compareNodes } from "./MkvsPrevNext"
import type { QuartzComponent, QuartzComponentConstructor } from "./types"

// Тело folder-страницы: текст index.md и под ним список вложенных страниц.
// На сайте это титульные страницы работ (labNN/index.md) — список служит
// содержанием работы — и указатель глоссария, где список скрыт стилями.
//
// Копия FolderContent из @quartz-community/folder-page
// (node_modules/@quartz-community/folder-page/dist/index.js), но строка списка —
// только название раздела. Штатная рядом с названием выводила дату изменения
// файла из git и теги страницы, а сами строки сортировала по этой дате: разделы
// шли в порядке последних правок, «1, 2, 6, 3…». Порядок здесь тот же, что в
// Проводнике и в кнопках «Предыдущее/Следующее», — compareNodes.
//
// Копия, а не настройка: у плагина есть только опция sort, а дату и теги в
// строке он рисует всегда. Подключается в quartz.ts вместо тела плагина.
//
// Компонент серверный. Оформление — styles/mkvs/_listing.scss.

export interface ListingEntry {
  slug: FullSlug
  title: string
}

// Строки списка для узла папки: вложенные страницы и подпапки в порядке
// Проводника. Страницы с unlisted: true пропускаются — их нет и в дереве слева.
export function listingEntries(folder: FileTrieNode<BuildTimeTrieData>): ListingEntry[] {
  return [...folder.children]
    .filter((node) => node.data?.unlisted !== true)
    .sort(compareNodes)
    .map((node) => ({ slug: node.slug, title: node.displayName }))
}

export default (() => {
  const FolderContent: QuartzComponent = ({ ctx, fileData, tree, allFiles }) => {
    const slug = fileData.slug
    if (!slug) return null

    // Дерево диспетчер строит до отрисовки страниц; запасной вариант — на
    // случай, если компонент отрисуют в обход него.
    ctx.trie ??= trieFromAllFiles(allFiles)
    const folder = ctx.trie.findNode(slug.split("/"))
    const entries = folder ? listingEntries(folder) : []

    const root = tree as Root
    const content =
      root.children.length === 0
        ? fileData.description
        : htmlToJsx(fileData.filePath as FilePath, root)
    const classes = (fileData.frontmatter?.cssclasses ?? []).join(" ")

    return (
      <div class="popover-hint">
        <article class={classes}>
          <div class="markdown-preview-view markdown-rendered">{content}</div>
        </article>
        <div class="page-listing">
          {entries.length > 0 && (
            <ul class="section-ul">
              {entries.map((entry) => (
                <li class="section-li">
                  <h3>
                    <a href={resolveRelative(slug, entry.slug)} class="internal">
                      {entry.title}
                    </a>
                  </h3>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    )
  }

  FolderContent.displayName = "MkvsFolderContent"
  return FolderContent
}) satisfies QuartzComponentConstructor
