import { ListItemNode, ListNode } from "@lexical/list"
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table"

// Keep in sync with the Lexical features in apps/web/src/payload/richText.ts. A test there
// fails when the two differ.
const RICH_TEXT_NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  TableNode,
  TableRowNode,
  TableCellNode,
]

/** Every node type RichTextEditor can load. It refuses content with any other type. */
const SUPPORTED_NODE_TYPES: ReadonlySet<string> = new Set([
  "root",
  "paragraph",
  "text",
  "linebreak",
  "tab",
  ...RICH_TEXT_NODES.map((node) => node.getType()),
])

export { RICH_TEXT_NODES, SUPPORTED_NODE_TYPES }
