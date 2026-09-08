import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { PageTypeDispatcher } from "./quartz/plugins/pageTypes/dispatcher"
import ExplorerHeadings from "./quartz/components/MkvsExplorerHeadings"

const config = await loadQuartzConfig()
export default config
export const layout = await loadQuartzLayout()

// Keep the normal Explorer; enrich its laboratory folders with heading links.
for (const pageLayout of [layout.defaults, ...Object.values(layout.byPageType)]) {
  if (pageLayout.left?.length && !pageLayout.left.includes(ExplorerHeadings)) {
    pageLayout.left = [...pageLayout.left, ExplorerHeadings]
  }
}

// loadQuartzConfig() has already created a dispatcher using the YAML layout.
// Replace it so both page HTML and component resources use our enriched layout.
config.plugins.emitters = config.plugins.emitters.map((emitter) =>
  emitter.name === "PageTypeDispatcher" ? PageTypeDispatcher(layout) : emitter,
)
