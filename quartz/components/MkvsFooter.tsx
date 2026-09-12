import type { QuartzComponent, QuartzComponentConstructor } from "./types"

// Подвал страницы: год и версия сайта рядом со ссылкой на репозиторий.
//
// Штатный @quartz-community/footer (в quartz.config.yaml он выключен) пишет
// «Создано с помощью Quartz v5.0.0 © <год сборки>». Студенту это ни о чём не
// говорит, а версия там — версия Quartz из package.json, а не пособий.
// Настроить эту строку плагин не даёт, поэтому подвал свой.
//
// Год и версия передаются из quartz.ts, а не берутся из даты сборки: сайт
// пересобирается при любой правке, и год сборки сменился бы сам, хотя тексты
// работ остались бы прежними. Пара «год, версия» меняется вместе и только при
// выпуске новой редакции.
//
// Компонент серверный. Оформление — styles/mkvs/_footer.scss.

export interface Options {
  year: number
  version: string
  links: Record<string, string>
}

export default ((opts: Options) => {
  const Footer: QuartzComponent = () => (
    <footer class="mkvs-footer">
      <p>
        {opts.year} · версия {opts.version}
        {Object.entries(opts.links).map(([text, href]) => (
          <>
            {" · "}
            <a href={href}>{text}</a>
          </>
        ))}
      </p>
    </footer>
  )

  Footer.displayName = "MkvsFooter"
  return Footer
}) satisfies QuartzComponentConstructor<Options>
