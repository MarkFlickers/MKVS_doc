import { crc32, deflateRawSync } from "zlib"

// Сборка ZIP-архива в памяти.
//
// Архивы с файлами работ собираются на каждой сборке сайта (см.
// quartz/util/mkvs-resources.ts), поэтому готовый архив нужен не файлом на
// диске, а массивом байтов: его длину показывает кнопка «Скачать файлы
// работы», а сами байты пишет в public/ эмиттер MkvsResources.
//
// Почему свой код, а не библиотека: в Node нет штатной записи ZIP, а всё, что
// от формата здесь нужно, — это deflate (есть в zlib), CRC32 (там же, начиная
// с Node 20.12) и три заголовка. Зависимость ради этого добавила бы в
// package.json расхождение с upstream, которое пришлось бы разрешать при
// каждом обновлении.
//
// Тонкости формата, которые важны именно этому сайту:
//
//   * имена элементов кириллические («МКВС.26 - ЛР5 - Resources/…»), поэтому в
//     каждом заголовке поднят флаг 0x0800 — «имя в UTF-8». Без него архиватор
//     читает имя в кодировке CP437 и распаковывает работу в папку с кракозябрами;
//   * разделитель в именах — «/» по спецификации (раздел 4.4.17.1), даже когда
//     архив собирают на Windows. Архив с «\» открывается только в Windows;
//   * время файлов проставляется фиксированное. Иначе архив пересобирался бы
//     каждый раз другим — а он собирается при каждой сборке сайта, и отличать
//     «изменились файлы работы» от «изменилось время сборки» было бы нечем.

export type ZipEntry = {
  // Путь внутри архива, разделитель — «/».
  name: string
  data: Buffer
}

const SIGNATURE_LOCAL = 0x04034b50
const SIGNATURE_CENTRAL = 0x02014b50
const SIGNATURE_END = 0x06054b50

const FLAG_UTF8_NAMES = 0x0800

// Версия 2.0 — минимальная, в которой есть deflate и каталоги.
const VERSION_NEEDED = 20
// Старший байт — система, в которой собран архив (3 = Unix): только для неё
// распаковщик читает права из external attributes.
const VERSION_MADE_BY = (3 << 8) | VERSION_NEEDED

// Обычный файл с правами 0644. В JS это записано умножением, а не сдвигом:
// «<< 16» работает со знаковым 32-битным числом и дало бы отрицательное.
const EXTERNAL_ATTRS_FILE = 0o100644 * 0x10000

// 1 января 1980 года 00:00 — нижняя граница, которую вообще умеет хранить
// формат: год отсчитывается от 1980, номер месяца и дня — с единицы.
const DOS_TIME = 0
const DOS_DATE = (0 << 9) | (1 << 5) | 1

// Максимумы полей заголовка. Больше — только ZIP64, которого здесь нет:
// файлы работ на три порядка меньше.
const MAX_ENTRIES = 0xffff
const MAX_SIZE = 0xffffffff

const METHOD_STORE = 0
const METHOD_DEFLATE = 8

type PreparedEntry = {
  name: Buffer
  method: number
  crc: number
  compressed: Buffer
  size: number
  offset: number
}

function prepare(entry: ZipEntry): Omit<PreparedEntry, "offset"> {
  if (entry.name.includes("\\")) {
    throw new Error(`[mkvs] В имени элемента архива «${entry.name}» обратная косая черта.`)
  }

  // Сжатие бессмысленно, когда оно увеличивает файл: у коротких заголовочных
  // файлов deflate иногда добавляет несколько байт. Тогда кладём как есть.
  const deflated = deflateRawSync(entry.data, { level: 9 })
  const useDeflate = deflated.length < entry.data.length

  const prepared = {
    name: Buffer.from(entry.name, "utf8"),
    method: useDeflate ? METHOD_DEFLATE : METHOD_STORE,
    crc: crc32(entry.data),
    compressed: useDeflate ? deflated : entry.data,
    size: entry.data.length,
  }

  if (prepared.size > MAX_SIZE || prepared.compressed.length > MAX_SIZE) {
    throw new Error(`[mkvs] Файл «${entry.name}» не помещается в ZIP без ZIP64.`)
  }

  return prepared
}

function localHeader(entry: PreparedEntry): Buffer {
  const header = Buffer.alloc(30)
  header.writeUInt32LE(SIGNATURE_LOCAL, 0)
  header.writeUInt16LE(VERSION_NEEDED, 4)
  header.writeUInt16LE(FLAG_UTF8_NAMES, 6)
  header.writeUInt16LE(entry.method, 8)
  header.writeUInt16LE(DOS_TIME, 10)
  header.writeUInt16LE(DOS_DATE, 12)
  header.writeUInt32LE(entry.crc, 14)
  header.writeUInt32LE(entry.compressed.length, 18)
  header.writeUInt32LE(entry.size, 22)
  header.writeUInt16LE(entry.name.length, 26)
  header.writeUInt16LE(0, 28) // extra field
  return header
}

function centralHeader(entry: PreparedEntry): Buffer {
  const header = Buffer.alloc(46)
  header.writeUInt32LE(SIGNATURE_CENTRAL, 0)
  header.writeUInt16LE(VERSION_MADE_BY, 4)
  header.writeUInt16LE(VERSION_NEEDED, 6)
  header.writeUInt16LE(FLAG_UTF8_NAMES, 8)
  header.writeUInt16LE(entry.method, 10)
  header.writeUInt16LE(DOS_TIME, 12)
  header.writeUInt16LE(DOS_DATE, 14)
  header.writeUInt32LE(entry.crc, 16)
  header.writeUInt32LE(entry.compressed.length, 20)
  header.writeUInt32LE(entry.size, 24)
  header.writeUInt16LE(entry.name.length, 28)
  header.writeUInt16LE(0, 30) // extra field
  header.writeUInt16LE(0, 32) // комментарий к файлу
  header.writeUInt16LE(0, 34) // номер тома
  header.writeUInt16LE(0, 36) // internal attributes
  header.writeUInt32LE(EXTERNAL_ATTRS_FILE, 38)
  header.writeUInt32LE(entry.offset, 42)
  return header
}

export function zip(entries: ZipEntry[]): Buffer {
  if (entries.length > MAX_ENTRIES) {
    throw new Error(`[mkvs] В архиве больше ${MAX_ENTRIES} файлов — нужен ZIP64.`)
  }

  const parts: Buffer[] = []
  const prepared: PreparedEntry[] = []
  let offset = 0

  for (const entry of entries) {
    // Смещение локального заголовка запоминаем ДО записи: на него потом
    // ссылается центральный каталог.
    const item = { ...prepare(entry), offset }
    const header = localHeader(item)

    parts.push(header, item.name, item.compressed)
    offset += header.length + item.name.length + item.compressed.length

    prepared.push(item)
  }

  const centralOffset = offset
  for (const item of prepared) {
    const header = centralHeader(item)
    parts.push(header, item.name)
    offset += header.length + item.name.length
  }

  const end = Buffer.alloc(22)
  end.writeUInt32LE(SIGNATURE_END, 0)
  end.writeUInt16LE(0, 4) // номер тома
  end.writeUInt16LE(0, 6) // том с началом каталога
  end.writeUInt16LE(prepared.length, 8)
  end.writeUInt16LE(prepared.length, 10)
  end.writeUInt32LE(offset - centralOffset, 12)
  end.writeUInt32LE(centralOffset, 16)
  end.writeUInt16LE(0, 20) // комментарий к архиву
  parts.push(end)

  return Buffer.concat(parts)
}
