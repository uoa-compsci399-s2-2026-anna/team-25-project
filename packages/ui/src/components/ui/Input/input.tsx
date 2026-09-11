import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "@repo/ui/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import type * as React from "react"

// Radius, fill and horizontal padding are the only things a variant owns, and they mirror
// `inputGroupVariants` one-for-one so a bare Input and an InputGroup of the same variant
// cannot drift apart.
const inputVariants = cva(
  "h-8 w-full min-w-0 border border-input py-1 text-base outline-none transition-colors file:inline-flex file:h-6 file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm placeholder:font-light placeholder:text-muted-foreground/70 placeholder:italic focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 dark:disabled:bg-input/80",
  {
    variants: {
      variant: {
        pill: "rounded-full bg-transparent px-5 hover:bg-brand-charcoal/10",
        box: "rounded-md bg-brand-cream/60 px-3 hover:bg-brand-cream",
      },
    },
    defaultVariants: {
      variant: "box",
    },
  },
)

function Input({
  className,
  type,
  variant = "box",
  ...props
}: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
  return (
    <InputPrimitive
      className={cn(inputVariants({ variant }), className)}
      data-slot="input"
      data-variant={variant}
      type={type}
      {...props}
    />
  )
}

export { Input, inputVariants }
