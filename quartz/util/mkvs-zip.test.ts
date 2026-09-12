import test, { describe } from "node:test"
import assert from "node:assert"
import { crc32, inflateRawSync } from "zlib"
import { zip } from "./mkvs-zip"

// Архив с файлами работы собирается своим кодом (в Node нет штатной записи
// ZIP), а распаковывать его будет не этот код, а архиватор на чужой машине.
// Поэтому тест не сверяет байты с эталоном, а читает архив обратно по
// спецификации — так же, как сделает распаковщик: находит концевую запись,
// идёт по центральному каталогу и по смещениям оттуда достаёт файлы.
//
// Проверяется в первую очередь то, на чём такой архив ломается у студента:
// флаг UTF-8 в именах (без него кириллица превращается в кракозябры), «/» в
// путях (с «\» архив открывается только в Windows) и совпадение CRC.

type ReadEntry = { name: string; data: Buffer; utf8: boolean; method: number }

function unzip(archive: Buffer): ReadEntry[] {
  // Концевая запись — последние 22 байта, комментария к архиву здесь нет.
  const end = archive.length - 22
  assert.strictEqual(archive.readUInt32LE(end), 0x06054b50, "нет концевой записи")

  const count = archive.readUInt16LE(end + 10)
  let at = archive.readUInt32LE(end + 16)

  const entries: ReadEntry[] = []
  for (let i = 0; i < count; i++) {
    assert.strictEqual(archive.readUInt32LE(at), 0x02014b50, "нет заголовка каталога")

    const flags = archive.readUInt16LE(at + 8)
    const method = archive.readUInt16LE(at + 10)
    const crc = archive.readUInt32LE(at + 16)
    const compressedSize = archive.readUInt32LE(at + 20)
    const size = archive.readUInt32LE(at + 24)
    const nameLength = archive.readUInt16LE(at + 28)
    const extraLength = archive.readUInt16LE(at + 30)
    const commentLength = archive.readUInt16LE(at + 32)
    const offset = archive.readUInt32LE(at + 42)
    const name = archive.subarray(at + 46, at + 46 + nameLength)

    // Файл лежит за локальным заголовком, длина которого зависит от имени.
    assert.strictEqual(archive.readUInt32LE(offset), 0x04034b50, "нет локального заголовка")
    const localName = archive.readUInt16LE(offset + 26)
    const localExtra = archive.readUInt16LE(offset + 28)
    const from = offset + 30 + localName + localExtra
    const stored = archive.subarray(from, from + compressedSize)
    const data = method === 8 ? inflateRawSync(stored) : stored

    assert.strictEqual(data.length, size, "длина файла разошлась с заголовком")
    assert.strictEqual(crc32(data), crc, "CRC разошлась с заголовком")

    entries.push({
      name: name.toString("utf8"),
      data,
      utf8: (flags & 0x0800) !== 0,
      method,
    })
    at += 46 + nameLength + extraLength + commentLength
  }

  return entries
}

describe("zip", () => {
  test("читается обратно, с содержимым и порядком записи", () => {
    const entries = unzip(
      zip([
        { name: "lab/a.txt", data: Buffer.from("первый") },
        { name: "lab/dir/b.txt", data: Buffer.from("второй") },
      ]),
    )

    assert.deepStrictEqual(
      entries.map((entry) => entry.name),
      ["lab/a.txt", "lab/dir/b.txt"],
    )
    assert.deepStrictEqual(
      entries.map((entry) => entry.data.toString()),
      ["первый", "второй"],
    )
  })

  test("кириллическое имя помечено как UTF-8", () => {
    const [entry] = unzip(
      zip([{ name: "МКВС.26 - ЛР5 - Resources/вгляд.c", data: Buffer.alloc(1) }]),
    )

    assert.ok(entry.utf8, "флаг UTF-8 не поднят — имя прочитают как CP437")
    assert.strictEqual(entry.name, "МКВС.26 - ЛР5 - Resources/вгляд.c")
  })

  test("длинный текст сжимается, короткий кладётся как есть", () => {
    const [compressible] = unzip(zip([{ name: "a", data: Buffer.alloc(4096, 0x61) }]))
    const [incompressible] = unzip(zip([{ name: "b", data: Buffer.from("x") }]))

    assert.strictEqual(compressible.method, 8, "повторяющийся текст должен сжаться")
    assert.strictEqual(incompressible.method, 0, "раздувать один байт незачем")
  })

  test("пустой архив остаётся читаемым", () => {
    assert.deepStrictEqual(unzip(zip([])), [])
  })

  test("одни и те же файлы дают побайтово одинаковый архив", () => {
    const files = [{ name: "lab/a.txt", data: Buffer.from("текст") }]
    assert.deepStrictEqual(zip(files), zip(files))
  })

  test("обратная косая черта в имени — ошибка, а не архив для одной Windows", () => {
    assert.throws(() => zip([{ name: "lab\\a.txt", data: Buffer.alloc(0) }]), /обратная косая/)
  })
})
