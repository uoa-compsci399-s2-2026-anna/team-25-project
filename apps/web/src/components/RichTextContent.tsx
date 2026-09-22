import { RichText } from "@payloadcms/richtext-lexical/react"
import { richTextConverters } from "@repo/ui/components/composite"
import { cn } from "@repo/ui/lib/utils"
import type { ComponentProps } from "react"

/**
 * Renders saved rich text with the same `rich-text` styles and table markup as RichTextEditor.
 * `null` is an empty optional field and renders nothing.
 */
export const RichTextContent = ({
  className,
  data,
}: {
  className?: string
  data: ComponentProps<typeof RichText>["data"] | null
}) =>
  data ? (
    <RichText className={cn("rich-text", className)} converters={richTextConverters} data={data} />
  ) : null
