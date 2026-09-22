import type { SerializedAutoLinkNode, SerializedLinkNode } from "@payloadcms/richtext-lexical"
import type { JSXConverter, JSXConvertersFunction } from "@payloadcms/richtext-lexical/react"

const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:"])

const safeHref = (url: unknown) => {
  if (typeof url !== "string") return null
  try {
    return SAFE_PROTOCOLS.has(new URL(url).protocol) ? url : null
  } catch {
    return null
  }
}

// Payload's converter renders any URL, so only safe ones stay links. The rest render as plain text.
const link: JSXConverter<SerializedAutoLinkNode | SerializedLinkNode> = ({ node, nodesToJSX }) => {
  const children = nodesToJSX({ nodes: node.children ?? [] })
  const href = node.fields?.linkType === "internal" ? null : safeHref(node.fields?.url)
  if (!href) return <>{children}</>
  return node.fields.newTab ? (
    <a href={href} rel="noopener noreferrer" target="_blank">
      {children}
    </a>
  ) : (
    <a href={href}>{children}</a>
  )
}

/**
 * Payload's default JSX converters, with these changes:
 * - Tables have no inline styles, so the `rich-text` utility styles them.
 * - Links are kept only for http, https and mailto URLs.
 * - Nodes with no converter render nothing, not the text "unknown node".
 */
const richTextConverters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  autolink: link,
  link,
  table: ({ node, nodesToJSX }) => (
    <div className="overflow-x-auto">
      <table>
        <tbody>{nodesToJSX({ nodes: node.children ?? [] })}</tbody>
      </table>
    </div>
  ),
  tablecell: ({ node, nodesToJSX }) => {
    const Cell = node.headerState > 0 ? "th" : "td"
    return (
      <Cell
        colSpan={node.colSpan && node.colSpan > 1 ? node.colSpan : undefined}
        rowSpan={node.rowSpan && node.rowSpan > 1 ? node.rowSpan : undefined}
      >
        {nodesToJSX({ nodes: node.children ?? [] })}
      </Cell>
    )
  },
  unknown: ({ node }) => {
    console.error("RichTextContent: no converter for node type", node.type)
    return null
  },
})

export { richTextConverters }
