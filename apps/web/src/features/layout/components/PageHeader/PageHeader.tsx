import { Heading } from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import type * as React from "react"

export interface PageHeaderProps {
  title: React.ReactNode
  description: React.ReactNode
  /** Content shown beside the description, such as buttons or a result count. */
  actions?: React.ReactNode
  /** Vertical alignment of `actions` against the description on wide screens. */
  align?: "center" | "end"
}

export function PageHeader({ title, description, actions, align = "center" }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 px-10 pt-12 pb-8 md:px-12">
      <Heading level="h1">{title}</Heading>
      <div
        className={cn(
          "flex flex-col gap-4 md:flex-row md:justify-between md:gap-8",
          align === "end" ? "md:items-end" : "md:items-center",
        )}
      >
        <p className="max-w-2xl text-muted-foreground">{description}</p>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
