import type { QuartzComponent, QuartzComponentProps } from "./types"

// Выходные данные пособия под текстом титульной страницы работы.
//
// Поля source / revision / author / year стоят во frontmatter работы с самого
// начала, но до этого компонента их не читал никто: ни другие компоненты, ни
// конфиг, ни плагины. При этом они были продублированы на КАЖДОЙ подстранице
// работы — двенадцать раз одно и то же, и любая правка (скажем, новая ревизия
// пособия) означала двенадцать одинаковых правок.
//
// Теперь поля живут только на labNN/index.md и видны на странице: читателю
// полезно знать, по какому изданию и какой ревизии он работает, а дублировать
// то, что выводится, уже незачем.
//
// Компонент серверный: строка известна во время сборки и попадает прямо в HTML.
// Оформление — styles/mkvs/_imprint.scss.

function textOf(value: unknown): string {
  return typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : ""
}

const Imprint: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const fm = fileData.frontmatter
  if (!fm) return null

  const source = textOf(fm.source)
  const revision = textOf(fm.revision)
  const author = textOf(fm.author)
  const year = textOf(fm.year)

  // Ни одного поля — значит, это не титульная страница работы.
  if (!source && !author && !year) return null

  return (
    <aside class="mkvs-imprint">
      {source && (
        <p class="mkvs-imprint-source">
          Источник: {source}
          {revision && ` (ревизия ${revision})`}
        </p>
      )}
      {(author || year) && (
        <p class="mkvs-imprint-author">
          {year && `© ${year}`}
          {year && author && ", "}
          {author}
        </p>
      )}
    </aside>
  )
}

Imprint.displayName = "MkvsImprint"
export default Imprint
