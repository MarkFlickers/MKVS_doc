import { readFileSync, readdirSync } from "fs"
import { join } from "path"
import { zip, type ZipEntry } from "./mkvs-zip"

// Архивы с файлами работ: откуда берутся и как собираются.
//
// Исходники лежат в репозитории, в resources/labNN/ — ровно в том виде, в
// каком их получит студент. Папку работы можно открыть в PlatformIO и собрать
// как есть, а правка файла видна обычным диффом.
//
// В content/ эти файлы не лежат намеренно: Quartz копирует в public/ КАЖДЫЙ
// не-markdown файл из content/, и все 184 исходника разъехались бы по сайту
// поштучно. Поэтому папка своя, а в public/ попадает только архив.
//
// Архив нигде не хранится: он собирается в память при сборке сайта и оттуда
// пишется в public/ (эмиттер MkvsResources). Раньше архивы лежали в
// content/labNN/resources/ готовыми файлами, и из-за этого историю ветки
// пришлось переписывать дважды (README, «Переписывание истории»): каждая
// пересборка добавляла в неё новый бинарник, а забытая пересборка оставляла
// на сайте архив, не совпадающий с текстом пособия. Ни того, ни другого
// теперь случиться не может — архив по определению собран из того, что сейчас
// лежит в репозитории.
//
// PDF среди исходников нет: документы работ собраны на странице
// content/docs/index.md и открываются в браузере, без скачивания и распаковки.

const SOURCE_DIR = "resources"

// Папка работы — resources/labNN, как и страница content/labNN.
const LAB_DIR = /^lab(\d+)$/

// Что не попадает в архив, даже если лежит в папке работы.
//
// Всё это PlatformIO и редактор создают заново у каждого пользователя, стоит
// один раз собрать проект прямо в репозитории. Каталог сборки .pio весит больше
// самого шаблона, а в автогенерируемой конфигурации VS Code остаются
// абсолютные пути с чужой машины, из-за которых у студента ломается навигация
// по коду (именно так испорченный архив ЛР4 однажды и уехал на сайт).
//
// Список повторяет тот, что PlatformIO сам кладёт в .gitignore нового проекта,
// поэтому git такие файлы и так не покажет. Здесь он продублирован, чтобы
// архив не зависел от того, настроен ли .gitignore у того, кто собирает сайт.
// extensions.json в список не входит: он не генерируется заново и советует
// студенту поставить нужное расширение.
const GENERATED = [
  /(^|\/)\.pio\//,
  /(^|\/)\.vscode\/(c_cpp_properties\.json|launch\.json|ipch\/|\.browse\.c_cpp\.db)/,
  /(^|\/)(__pycache__|\.git|node_modules)\//,
  /\.pyc$/,
  /(^|\/)(\.DS_Store|Thumbs\.db|desktop\.ini)$/,
]

// Ключ карты архивов — путь архива на сайте: он же путь внутри public/ и он
// же — то, что стоит ссылкой в markdown работы.
export type LabArchive = {
  // Папка с исходниками, от корня репозитория.
  sourceDir: string
  // Папка, в которую распакуется архив. Именно она, а не «Resources»: архивы
  // разных работ не должны сливаться в одну кучу на рабочем столе студента.
  entryRoot: string
}

function walk(dir: string, prefix = ""): string[] {
  const found: string[] = []
  for (const item of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name < b.name ? -1 : 1,
  )) {
    const relative = prefix ? `${prefix}/${item.name}` : item.name
    if (item.isDirectory()) {
      found.push(...walk(join(dir, item.name), relative))
    } else if (item.isFile()) {
      found.push(relative)
    }
  }
  return found
}

let discovered: Map<string, LabArchive> | null = null

// Работы перечисляются по папкам в resources/: у ЛР3 файлов для проекта нет,
// и архива у неё тоже нет — как и папки.
export function labArchives(): Map<string, LabArchive> {
  if (discovered) return discovered

  discovered = new Map()

  let dirs: string[]
  try {
    dirs = readdirSync(join(process.cwd(), SOURCE_DIR), { withFileTypes: true })
      .filter((item) => item.isDirectory() && LAB_DIR.test(item.name))
      .map((item) => item.name)
      .sort()
  } catch {
    console.warn(
      `[mkvs] Папки ${SOURCE_DIR}/ нет — архивы с файлами работ не собраны. ` +
        "Сборку запускают из корня репозитория.",
    )
    return discovered
  }

  for (const dir of dirs) {
    const number = Number.parseInt(dir.match(LAB_DIR)![1], 10)
    discovered.set(`${dir}/resources/mkvs-26-lr${number}-resources.zip`, {
      sourceDir: join(process.cwd(), SOURCE_DIR, dir),
      entryRoot: `МКВС.26 - ЛР${number} - Resources`,
    })
  }

  return discovered
}

const built = new Map<string, Buffer>()

// Байты архива. Их спрашивают дважды: плагин MkvsDownload — чтобы показать
// размер в кнопке, эмиттер MkvsResources — чтобы записать архив в public/.
// Между этими двумя обращениями проходит вся сборка, поэтому собранное
// кешируется и в одном процессе каждый архив собирается один раз.
//
// Разбор markdown Quartz умеет уводить в рабочие потоки, и там, в своём
// процессе, MkvsDownload соберёт архив ещё раз — на паре сотен текстовых
// файлов это доли секунды, а общего временного файла, за который потоки
// дрались бы, нет вовсе.
//
// Того же устройства и ограничение: при `npx quartz build --serve` правка в
// resources/ на сайт не приезжает, нужен перезапуск сборки. Слежение Quartz
// смотрит только в content/, и заводить своё ради папки, которая меняется раз
// в семестр, незачем.
export function archiveBytes(publicPath: string): Buffer | null {
  const cached = built.get(publicPath)
  if (cached) return cached

  const lab = labArchives().get(publicPath)
  if (!lab) return null

  const entries: ZipEntry[] = []
  for (const relative of walk(lab.sourceDir)) {
    if (GENERATED.some((pattern) => pattern.test(relative))) continue
    entries.push({
      name: `${lab.entryRoot}/${relative}`,
      data: readFileSync(join(lab.sourceDir, relative)),
    })
  }

  // Пустая папка работы — это не пустой архив, а его отсутствие: кнопку
  // «Скачать файлы работы» в таком случае ставить не из чего, и о ней
  // предупредит MkvsDownload.
  if (entries.length === 0) return null

  const archive = zip(entries)
  built.set(publicPath, archive)
  return archive
}
