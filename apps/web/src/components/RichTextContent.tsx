import { RichText } from "@payloadcms/richtext-lexical/react"
import { richTextConverters } from "@repo/ui/components/composite"
import { cn } from "@repo/ui/lib/utils"
import type { ComponentProps } from "react"

// Saved rich text, styled the same as RichTextEditor.
export const RichTextContent = ({
  className,
  data,
}: {
  className?: string
  data: ComponentProps<typeof RichText>["data"]
}) => (
  <RichText className={cn("rich-text", className)} converters={richTextConverters} data={data} />
)
