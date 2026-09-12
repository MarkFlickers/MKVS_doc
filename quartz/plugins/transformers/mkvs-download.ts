import { visit } from "unist-util-visit"
import type { Root, Element } from "hast"
import { archiveBytes } from "../../util/mkvs-resources"
import type { QuartzTransformerPlugin } from "../types"

// Кнопка «Скачать файлы работы»: размер архива подставляется на сборке.
//
// Раньше в markdown лежал сырой HTML со служебными атрибутами и размером,
// вписанным руками:
//
//   <a class="mkvs-download" href="lab01/resources/…zip" download
//      data-router-ignore data-no-popover="true">Скачать файлы работы — ZIP, 7 КБ</a>
//
// Архив пересобирается при каждой сборке сайта, а число в markdown оставалось
// старым — и заметить это можно было только глазами.
//
// Теперь в markdown обычная ссылка на архив, а всё остальное делает этот
// плагин: ставит класс и три атрибута, без которых архив «открывается» вместо
// того, чтобы скачиваться, и дописывает размер того самого архива, который
// эмиттер MkvsResources положит в public/ (util/mkvs-resources.ts отдаёт им
// обоим одни и те же байты).
//
// Плагин добавляется в quartz.ts последним, поэтому к его приходу
// @quartz-community/crawl-links уже переписал href в относительный
// («../lab01/resources/…»). Поэтому путь к архиву восстанавливается срезанием
// ведущих «../» — так плагин не зависит от того, где стоит в цепочке.

const DOWNLOAD_CLASS = "mkvs-download"

function sizeKb(href: string): number | null {
  // «../../lab01/resources/x.zip» -> «lab01/resources/x.zip»
  const publicPath = decodeURIComponent(href.replace(/^(?:\.\.?\/)+/, ""))
  const archive = archiveBytes(publicPath)
  if (!archive) return null
  // Ниже килобайта округление до нуля выглядело бы как ошибка.
  return Math.max(1, Math.round(archive.length / 1024))
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
              `[mkvs] Архив ${href} собрать не из чего — размер в кнопке ` +
                "«Скачать файлы работы» не подставлен, а на сайте её ссылка " +
                "приведёт в никуда. Проверьте, что файлы работы лежат в " +
                "resources/labNN и что имя архива в ссылке совпадает с именем " +
                "папки работы.",
            )
            return
          }

          node.children.push({ type: "text", value: ` — ZIP, ${kb} КБ` })
        })
      },
    ]
  },
})
