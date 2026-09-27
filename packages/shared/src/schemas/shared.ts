import { z } from "zod"

// Mirrors the Lexical editor state Payload's richText field stores `body` as.
export const richTextSchema = z
  .object({
    root: z.object({
      type: z.string(),
      children: z.array(z.object({ type: z.any(), version: z.number() }).catchall(z.unknown())),
      direction: z.enum(["ltr", "rtl"]).nullable(),
      format: z.enum(["left", "start", "center", "right", "end", "justify", ""]),
      indent: z.number(),
      version: z.number(),
    }),
  })
  .catchall(z.unknown())

type RichTextNodeLike = { text?: unknown; children?: unknown }

// True when any node in the tree has visible text. An empty editor still holds an empty paragraph.
export const richTextHasText = (node: unknown): boolean => {
  if (typeof node !== "object" || node === null) return false
  const { children, text } = node as RichTextNodeLike
  if (typeof text === "string" && text.trim() !== "") return true
  return Array.isArray(children) && children.some(richTextHasText)
}
