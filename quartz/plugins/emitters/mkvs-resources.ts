import { mkdir, writeFile } from "fs/promises"
import { dirname } from "path"
import { joinSegments, type FilePath } from "../../util/path"
import { archiveBytes, labArchives } from "../../util/mkvs-resources"
import type { QuartzEmitterPlugin } from "../types"

// Архивы с файлами работ в public/.
//
// Собираются из resources/labNN на каждой сборке — см. util/mkvs-resources.ts,
// там же описано, почему исходники лежат вне content/ и почему сами архивы
// не хранятся в репозитории.
//
// Путь архива в public/ совпадает с тем, что стоит ссылкой в markdown работы
// («labNN/resources/mkvs-26-lrN-resources.zip»), поэтому ссылку Quartz
// обрабатывает как любую другую ссылку на файл рядом со страницей.
export const MkvsResources: QuartzEmitterPlugin = () => ({
  name: "MkvsResources",
  async *emit({ argv }) {
    for (const publicPath of labArchives().keys()) {
      const archive = archiveBytes(publicPath)
      if (!archive) continue

      const destination = joinSegments(argv.output, publicPath) as FilePath
      await mkdir(dirname(destination), { recursive: true })
      await writeFile(destination, archive)
      yield destination
    }
  },
  // При `--serve` слежение Quartz смотрит только в content/, изменений в
  // resources/ оно не увидит, а уже записанные архивы в public/ остаются на
  // месте. Пересобирать здесь нечего.
  async *partialEmit() {},
})
