import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cn } from "@repo/ui/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  " font-heading cursor-pointer border border-transparent tracking-normal group/button inline-flex shrink-0 items-center justify-center rounded-full bg-clip-padding whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        "button-charcoal": "bg-brand-charcoal text-white hover:bg-brand-charcoal/80",
        "button-mauve": "bg-brand-mauve text-white hover:bg-brand-mauve/80",
        "button-transparent": "bg-transparent text-brand-charcoal hover:bg-brand-charcoal/10",
        "button-white": "bg-white text-brand-charcoal hover:bg-brand-charcoal/10",
        "button-cream": "bg-brand-cream text-brand-charcoal hover:bg-brand-charcoal/10",
        "button-unstyled": "",
      },
      borderColor: {
        charcoal: "border-brand-charcoal",
        white: "border-white",
      },
      active: {
        true: "underline underline-offset-2",
        false: "",
      },
      size: {
        sm: "h-6 gap-1.5 px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        md: "h-7 gap-1.5 px-2.5 text-sm in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 text-sm has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xl: "h-11 gap-1.5 px-3 text-base has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "button-charcoal",
      active: false,
      size: "md",
    },
  },
)

function Button({
  className,
  variant = "button-charcoal",
  borderColor,
  active = false,
  size = "md",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      className={cn(
        buttonVariants({
          variant,
          borderColor,
          active,
          size,
          className,
        }),
      )}
      data-slot="button"
      {...props}
    />
  )
}

export { Button, buttonVariants }
