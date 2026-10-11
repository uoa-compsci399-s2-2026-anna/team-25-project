import { Button } from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import { Download, FileText } from "lucide-react"
import type * as React from "react"

type AttachmentListItem = {
  id: number | string
  name: string
  href: string
  /** A readable type, such as "PDF". */
  type?: string
  /** In bytes. */
  size?: number
}

type AttachmentListProps = React.ComponentProps<"ul"> & {
  attachments: AttachmentListItem[]
}

const sizeUnits = ["B", "KB", "MB", "GB"] as const

const formatFileSize = (bytes: number) => {
  let size = bytes
  let unit = 0
  while (size >= 1024 && unit < sizeUnits.length - 1) {
    size /= 1024
    unit += 1
  }
  // Whole bytes never need a decimal, and a tenth is enough to tell larger files apart.
  return `${unit === 0 ? size : size.toFixed(1)} ${sizeUnits[unit]}`
}

function AttachmentList({ attachments, className, ...props }: AttachmentListProps) {
  return (
    // Only as wide as its longest row, but never wider than its container, so long names still truncate.
    <ul
      className={cn("flex w-fit max-w-full flex-col divide-y rounded-lg border", className)}
      {...props}
    >
      {attachments.map((attachment) => {
        const details = [
          attachment.type,
          attachment.size != null && formatFileSize(attachment.size),
        ].filter(Boolean)

        return (
          <li className="flex items-center gap-3 px-4 py-3" key={attachment.id}>
            <FileText aria-hidden className="size-5 shrink-0 text-muted-foreground" />
            <div className="mr-auto flex min-w-0 flex-col pr-3">
              <p className="truncate font-medium text-sm">{attachment.name}</p>
              {details.length > 0 && (
                <p className="text-muted-foreground text-xs">{details.join(" - ")}</p>
              )}
            </div>
            <Button
              aria-label={`Download ${attachment.name}`}
              borderColor="charcoal"
              className="shrink-0"
              nativeButton={false}
              render={<a download={attachment.name} href={attachment.href} />}
              size="md"
              variant="button-transparent"
            >
              <Download data-icon="inline-start" />
              Download
            </Button>
          </li>
        )
      })}
    </ul>
  )
}

export { AttachmentList, type AttachmentListItem, type AttachmentListProps, formatFileSize }
