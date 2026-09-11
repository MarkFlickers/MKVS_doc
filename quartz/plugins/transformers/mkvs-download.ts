import { statSync } from "fs"
import { join } from "path"
import { visit } from "unist-util-visit"
import type { Root, Element } from "hast"
import type { QuartzTransformerPlugin } from "../types"

// Кнопка «Скачать файлы работы»: размер архива подставляется на сборке.
//
// Раньше в markdown лежал сырой HTML со служебными атрибутами и размером,
// вписанным руками:
//
//   <a class="mkvs-download" href="lab01/resources/…zip" download
//      data-router-ignore data-no-popover="true">Скачать файлы работы — ZIP, 7 КБ</a>
//
// При каждом перезапуске tools/pack-resources.ps1 архив меняется, а число в
// markdown остаётся старым — и заметить это можно только глазами.
//
// Теперь в markdown обычная ссылка на архив, а всё остальное делает этот
// плагин: ставит класс и три атрибута, без которых архив «открывается» вместо
// того, чтобы скачиваться, и дописывает размер, прочитанный с диска.
//
// Плагин добавляется в quartz.ts последним, поэтому к его приходу
// @quartz-community/crawl-links уже переписал href в относительный
// («../lab01/resources/…»). Поэтому путь к файлу восстанавливается срезанием
// ведущих «../» — так плагин не зависит от того, где стоит в цепочке.

const DOWNLOAD_CLASS = "mkvs-download"

function sizeKb(href: string): number | null {
  // «../../lab01/resources/x.zip» -> «lab01/resources/x.zip»
  const relative = href.replace(/^(?:\.\.?\/)+/, "")
  try {
    const bytes = statSync(join(process.cwd(), "content", decodeURIComponent(relative))).size
    // Ниже килобайта округление до нуля выглядело бы как ошибка.
    return Math.max(1, Math.round(bytes / 1024))
  } catch {
    return null
  }
}

export const MkvsDownload: QuartzTransformerPlugin = () => ({
  name: "MkvsDownload",
  htmlPlugins() {
    return [
      () => (tree: Root) => {
        visit(tree, "element", (node: Element) => {
          if (node.tagName !== "a") return
          const href = node.properties?.href
          if (typeof href !== "string" || !href.endsWith(".zip")) return

          const classes = node.properties.className
          node.properties.className = Array.isArray(classes)
            ? [DOWNLOAD_CLASS, ...classes]
            : [DOWNLOAD_CLASS]

          // download — браузер сохраняет файл, а не уходит с сайта;
          // data-router-ignore — SPA-роутер не перехватывает щелчок;
          // data-no-popover — всплывающая подсказка не тянет архив при наведении.
          node.properties.download = true
          node.properties.dataRouterIgnore = true
          node.properties.dataNoPopover = "true"

          const kb = sizeKb(href)
          if (kb === null) {
            console.warn(
              `[mkvs] Архив ${href} не найден на диске — размер в кнопке ` +
                "«Скачать файлы работы» не подставлен. Запустите " +
                "tools/pack-resources.ps1.",
            )
            return
          }

          node.children.push({ type: "text", value: ` — ZIP, ${kb} КБ` })
        })
      },
    ]
  },
})
