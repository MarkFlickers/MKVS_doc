import test, { describe } from "node:test"
import assert from "node:assert"
import { matcher, terms, termOf } from "./mkvs-search-query"

// Разбор запроса воспроизводит логику плагина @quartz-community/search, и от
// него зависит НУМЕРАЦИЯ совпадений: счётчик в карточке, панель «‹ 3 / 12 ›» и
// переход к нужному вхождению обязаны считать одно и то же.
//
// Самое хрупкое место — порядок по убыванию длины. В регулярном выражении
// альтернативы проверяются слева направо, поэтому сочетание слов должно стоять
// РАНЬШЕ отдельных слов: иначе фраза «настройка GPIO» посчиталась бы двумя
// совпадениями вместо одного, и нумерация разошлась бы с превью.

function fakeInput(value: string): HTMLInputElement {
  return { value } as HTMLInputElement
}

describe("terms", () => {
  test("одно слово остаётся одним", () => {
    assert.deepStrictEqual(terms("GPIO"), ["GPIO"])
  })

  test("два слова дают сочетание, и оно стоит первым", () => {
    assert.deepStrictEqual(terms("настройка GPIO"), ["настройка GPIO", "настройка", "GPIO"])
  })

  test("нарастающие сочетания для трёх слов, по убыванию длины", () => {
    assert.deepStrictEqual(terms("a bb ccc"), ["a bb ccc", "a bb", "ccc", "bb", "a"])
  })

  test("лишние пробелы не порождают пустых слов", () => {
    assert.deepStrictEqual(terms("  настройка   GPIO  "), ["настройка GPIO", "настройка", "GPIO"])
  })

  test("пустой запрос — пустой список", () => {
    assert.deepStrictEqual(terms(""), [])
    assert.deepStrictEqual(terms("   "), [])
  })

  test("длина считается в символах, не в словах", () => {
    const result = terms("порт ввода-вывода")
    for (let i = 1; i < result.length; i++) {
      assert.ok(
        result[i - 1].length >= result[i].length,
        `нарушен порядок: «${result[i - 1]}» перед «${result[i]}»`,
      )
    }
  })
})

describe("matcher", () => {
  test("пустой запрос не даёт выражения", () => {
    assert.strictEqual(matcher(""), null)
    assert.strictEqual(matcher("   "), null)
  })

  test("фраза целиком считается одним совпадением, а не двумя", () => {
    const regex = matcher("настройка GPIO")
    assert.ok(regex)
    const found = "настройка GPIO выполняется так".match(regex)
    assert.deepStrictEqual(found, ["настройка GPIO"])
  })

  test("регистр не важен", () => {
    const regex = matcher("gpio")
    assert.ok(regex)
    assert.deepStrictEqual("GPIO и Gpio".match(regex), ["GPIO", "Gpio"])
  })

  test("спецсимволы регулярных выражений экранируются", () => {
    const regex = matcher("main.c")
    assert.ok(regex)
    // Без экранирования точка совпала бы с любым символом, и «mainXc» тоже
    // попал бы в счётчик.
    assert.deepStrictEqual("main.c и mainXc".match(regex), ["main.c"])
  })

  test("скобки и звёздочка не ломают выражение", () => {
    assert.doesNotThrow(() => matcher("(void) *ptr [0]"))
  })

  test("флаг g выставлен: без него поиск совпадений зациклился бы", () => {
    const regex = matcher("gpio")
    assert.ok(regex?.global)
  })
})

describe("termOf", () => {
  test("обычный запрос отдаётся как есть", () => {
    assert.strictEqual(termOf(fakeInput("настройка GPIO")), "настройка GPIO")
  })

  test("слова с решёткой — это фильтр по тегам, в подсветку не идут", () => {
    assert.strictEqual(termOf(fakeInput("#platformio настройка")), "настройка")
  })

  test("запрос из одних тегов заменяется именами тегов", () => {
    assert.strictEqual(termOf(fakeInput("#platformio #vscode")), "platformio vscode")
  })

  test("лишние пробелы срезаются", () => {
    assert.strictEqual(termOf(fakeInput("  GPIO  ")), "GPIO")
  })
})
