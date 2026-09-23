import { cn } from "@repo/ui/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2Icon } from "lucide-react"

const spinnerVariants = cva("animate-spin text-muted-foreground", {
  variants: {
    size: {
      sm: "size-3",
      default: "size-4",
      lg: "size-6",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

type SpinnerProps = Omit<React.ComponentProps<typeof Loader2Icon>, "size"> &
  VariantProps<typeof spinnerVariants>

function Spinner({ className, size, ...props }: SpinnerProps) {
  return (
    <Loader2Icon
      aria-label="Loading"
      className={cn(spinnerVariants({ size }), className)}
      data-slot="spinner"
      role="status"
      {...props}
    />
  )
}

export { Spinner, spinnerVariants }
