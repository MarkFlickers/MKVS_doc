import type { QuartzComponent } from "./types"
import script from "./mkvs-explorer-headings.inline"

type Heading = { depth: number; text: string; slug: string }

const ExplorerHeadings: QuartzComponent = ({ allFiles }) => {
  const outlines: Record<string, Heading[]> = {}
  for (const file of allFiles) {
    const slug = String(file.slug ?? "")
    if (!/(?:^|\/)lab\d+\/index$/.test(slug)) continue
    const toc = file.toc as Heading[] | undefined
    if (toc?.length) outlines[slug] = toc
  }
  return <div hidden style="display:none" data-mkvs-outlines={JSON.stringify(outlines)} />
}

ExplorerHeadings.displayName = "MkvsExplorerHeadings"
ExplorerHeadings.afterDOMLoaded = script
export default ExplorerHeadings
