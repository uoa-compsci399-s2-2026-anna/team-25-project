"use client"

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { cn } from "@repo/ui/lib/utils"
import { Check, Minus } from "lucide-react"

function Checkbox({ className, indeterminate, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "peer flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-[4px] border border-input bg-transparent shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-checked:border-primary data-indeterminate:border-primary data-checked:bg-primary data-indeterminate:bg-primary data-checked:text-primary-foreground data-indeterminate:text-primary-foreground not-aria-disabled:data-unchecked:hover:border-primary not-aria-disabled:data-checked:hover:bg-primary/80 not-aria-disabled:data-indeterminate:hover:bg-primary/80 dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      data-slot="checkbox"
      indeterminate={indeterminate}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className="flex items-center justify-center text-primary-foreground transition-none"
        data-slot="checkbox-indicator"
      >
        {indeterminate ? <Minus className="size-3" /> : <Check className="size-3" />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
