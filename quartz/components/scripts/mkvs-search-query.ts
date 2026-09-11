// ---------------------------------------------------------------------------
// Разбор запроса — повторяет плагин
// ---------------------------------------------------------------------------

// Плагин ищет не только слова запроса, но и их нарастающие сочетания:
// «настройка GPIO» -> ["настройка", "GPIO", "настройка GPIO"]. Порядок по
// убыванию длины важен: в регулярном выражении сочетание должно стоять раньше
// отдельных слов, иначе фраза посчиталась бы двумя совпадениями вместо одного.
export function terms(query: string): string[] {
  const words = query.split(/\s+/).filter((word) => word.trim() !== "")
  const count = words.length
  if (count > 1) {
    for (let i = 1; i < count; i++) words.push(words.slice(0, i + 1).join(" "))
  }
  return words.sort((a, b) => b.length - a.length)
}

export function matcher(query: string): RegExp | null {
  const parts = terms(query)
    .filter((word) => word.trim() !== "")
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  if (parts.length === 0) return null
  return new RegExp(parts.join("|"), "gi")
}

// Слова, начинающиеся с решётки, — это фильтр по тегам, в подсветку они не
// идут. Пустой запрос при поиске по тегам плагин заменяет именами тегов.
export function termOf(input: HTMLInputElement): string {
  const raw = input.value
  const tags: string[] = []
  const words: string[] = []
  for (const word of raw.split(/\s+/)) {
    if (word.startsWith("#")) tags.push(word.substring(1))
    else if (word !== "") words.push(word)
  }
  const query = words.join(" ").trim()
  return query || (tags.length > 0 ? tags.join(" ") : raw.trim())
}
