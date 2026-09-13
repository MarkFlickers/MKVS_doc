import test, { describe } from "node:test"
import assert from "node:assert"
import { pagePath, parentSlugs } from "./mkvs-path"

// Путь до страницы выводится в двух местах — в карточке результата поиска и
// в кнопках «Предыдущее/Следующее», — и в обоих его строит pagePath.

describe("parentSlugs", () => {
  test("у страницы внутри работы одна папка-родитель", () => {
    assert.deepStrictEqual(parentSlugs("lab02/02-main"), ["lab02/index"])
  })

  test("у страницы самой работы и у титульной родителей нет", () => {
    assert.deepStrictEqual(parentSlugs("lab02/index"), [])
    assert.deepStrictEqual(parentSlugs("index"), [])
  })

  test("вложенные папки перечисляются сверху вниз", () => {
    assert.deepStrictEqual(parentSlugs("a/b/page"), ["a/index", "a/b/index"])
    assert.deepStrictEqual(parentSlugs("a/b/index"), ["a/index"])
  })
})

describe("pagePath", () => {
  const titles: Record<string, string> = {
    "a/index": "Первая",
    "a/b/index": "Вторая",
  }

  test("названия папок идут через « › »", () => {
    assert.strictEqual(
      pagePath("a/b/page", (slug) => titles[slug]),
      "Первая › Вторая",
    )
  })

  test("папку без названия подписывает сегмент адреса", () => {
    assert.strictEqual(
      pagePath("x/y/page", () => undefined),
      "x › y",
    )
  })

  test("у страниц верхнего уровня путь пустой", () => {
    assert.strictEqual(
      pagePath("a/index", (slug) => titles[slug]),
      "",
    )
  })
})
