import { Collapsible, CollapsiblePanel, CollapsibleTrigger, Heading } from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import { ChevronDownIcon } from "lucide-react"
import type { ReactNode } from "react"

/** A profile section that opens and closes when its heading is clicked. It starts open. */
export const MemberDetailSection = ({
  className,
  title,
  headerAction,
  children,
}: {
  className?: string
  title: string
  /** Shown beside the heading, and kept visible when the section is closed. */
  headerAction?: ReactNode
  children: ReactNode
}) => (
  <Collapsible className={cn("flex flex-col", className)} defaultOpen render={<section />}>
    <div className="flex flex-row items-center justify-between gap-3">
      {/* The button sits inside the heading, as the WAI-ARIA accordion pattern asks. */}
      <Heading level="h2">
        <CollapsibleTrigger className="group flex cursor-pointer items-center gap-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {title}
          <ChevronDownIcon
            aria-hidden="true"
            className="size-5 transition-transform group-data-panel-open:rotate-180 motion-reduce:transition-none"
          />
        </CollapsibleTrigger>
      </Heading>
      {headerAction}
    </div>
    {/* The padding stops the panel's overflow-hidden from clipping focus rings. */}
    <CollapsiblePanel className="-mx-1 px-1">
      <div className="flex flex-col gap-4 pt-4 pb-1">{children}</div>
    </CollapsiblePanel>
  </Collapsible>
)
