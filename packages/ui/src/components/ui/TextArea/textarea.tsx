import { cn } from "@repo/ui/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import type * as React from "react"

const textAreaVariants = cva(
  "field-sizing-content flex min-h-16 w-full border border-input px-3 py-2 text-base outline-none transition-colors placeholder:font-light placeholder:text-muted-foreground/70 placeholder:italic focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm",
  {
    variants: {
      variant: {
        // A textarea grows, so the sibling `pill` radius is softened to a fixed one: at
        // `rounded-full` the corners eat the first and last lines of text once the box is
        // taller than a single row.
        pill: "rounded-2xl bg-transparent hover:bg-brand-charcoal/10",
        box: "rounded-md bg-brand-cream/60 hover:bg-brand-cream",
      },
    },
    defaultVariants: {
      variant: "box",
    },
  },
)

function TextArea({
  className,
  variant = "box",
  ...props
}: React.ComponentProps<"textarea"> & VariantProps<typeof textAreaVariants>) {
  return (
    <textarea
      className={cn(textAreaVariants({ variant }), className)}
      data-slot="textarea"
      data-variant={variant}
      {...props}
    />
  )
}

export { TextArea, textAreaVariants }
