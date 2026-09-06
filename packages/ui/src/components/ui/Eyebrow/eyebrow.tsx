import { cn } from "@repo/ui/lib/utils"
import type * as React from "react"

function Eyebrow({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "font-semibold text-primary text-xs uppercase tracking-widest md:text-sm",
        className,
      )}
      data-slot="eyebrow"
      {...props}
    />
  )
}

export { Eyebrow }
