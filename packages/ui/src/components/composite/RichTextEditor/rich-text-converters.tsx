import type { JSXConvertersFunction } from "@payloadcms/richtext-lexical/react"

/**
 * Converters for additional rich text editor nodes.
 */
const richTextConverters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  table: ({ node, nodesToJSX }) => (
    <div className="overflow-x-auto">
      <table>
        <tbody>{nodesToJSX({ nodes: node.children })}</tbody>
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
        {nodesToJSX({ nodes: node.children })}
      </Cell>
    )
  },
})

export { richTextConverters }
