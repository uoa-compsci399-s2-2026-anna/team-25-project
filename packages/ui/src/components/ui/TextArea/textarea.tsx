import { cn } from "@repo/ui/lib/utils"
import type * as React from "react"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "field-sizing-content flex min-h-16 w-full rounded-md border border-input bg-brand-cream px-2.5 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-black/20 focus-visible:ring-1 focus-visible:ring-black/10 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 dark:disabled:bg-input/80",
        className,
      )}
      data-slot="textarea"
      {...props}
    />
  )
}

export { Textarea }
