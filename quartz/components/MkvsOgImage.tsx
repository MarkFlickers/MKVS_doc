import type { SocialImageOptions } from "@quartz-community/og-image"
import type { FontSpecification, Theme } from "../util/theme"

// Картинка-превью страницы для мессенджеров и соцсетей (og:image).
//
// Копия разметки по умолчанию из @quartz-community/og-image
// (node_modules/@quartz-community/og-image/dist/index.js, defaultImage), но без
// строки с датой изменения и временем чтения. С самих страниц эти сведения тоже
// убраны (плагин content-meta выключен): студенту они ни о чём не говорят.
//
// Копия, а не настройка: отключить эту строку плагин не даёт, а свою разметку
// принимает только целиком, опцией imageStructure. Подключается в quartz.ts.
//
// Разметку рисует не браузер, а Satori. Поэтому стили только инлайновые, а у
// каждого div с несколькими потомками обязателен display: flex.

type ImageStructure = SocialImageOptions["imageStructure"]

function fontName(spec: FontSpecification): string {
  return typeof spec === "string" ? spec : spec.name
}

const OgImage: ImageStructure = ({ cfg, userOpts, title, description, fileData, iconBase64 }) => {
  // Конфигурация приходит тем же объектом, что и везде в сборке, но в типах
  // плагина (@quartz-community/types) поле theme объявлено как unknown. Тип
  // темы — собственный, из util/theme.ts.
  const theme = cfg.theme as Theme
  const colors = theme.colors[userOpts.colorScheme]
  const bodyFont = fontName(theme.typography.body)
  const headerFont = fontName(theme.typography.header)
  const tags = fileData.frontmatter?.tags ?? []

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        backgroundColor: colors.light,
        padding: "2.5rem",
        fontFamily: bodyFont,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
        {iconBase64 && (
          <img src={iconBase64} alt="" width={56} height={56} style={{ borderRadius: "50%" }} />
        )}
        <div style={{ display: "flex", fontSize: 32, color: colors.gray }}>{cfg.baseUrl}</div>
      </div>

      <div style={{ display: "flex", marginTop: "1rem", marginBottom: "1.5rem" }}>
        <h1
          style={{
            margin: 0,
            fontSize: title.length > 32 ? 64 : 72,
            fontFamily: headerFont,
            fontWeight: 700,
            color: colors.dark,
            lineHeight: 1.2,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </h1>
      </div>

      <div
        style={{ display: "flex", flex: 1, fontSize: 36, color: colors.darkgray, lineHeight: 1.4 }}
      >
        <p
          style={{
            margin: 0,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 5,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {description}
        </p>
      </div>

      {/* Нижняя строка по умолчанию делилась на дату со временем чтения слева
          и теги справа. Остались только теги, у страниц без тегов строки нет. */}
      {tags.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            flexWrap: "wrap",
            gap: "0.5rem",
            marginTop: "2rem",
            paddingTop: "2rem",
            borderTop: `1px solid ${colors.lightgray}`,
          }}
        >
          {tags.slice(0, 3).map((tag) => (
            <div
              style={{
                display: "flex",
                padding: "0.5rem 1rem",
                backgroundColor: colors.highlight,
                color: colors.secondary,
                borderRadius: "10px",
                fontSize: 24,
              }}
            >
              #{tag}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default OgImage
