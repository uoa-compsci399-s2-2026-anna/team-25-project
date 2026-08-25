import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cn } from "@repo/ui/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const headingVariants = cva("font-heading text-foreground tracking-[-0.04em]", {
  variants: {
    level: {
      h1: "text-3xl font-semibold md:text-5xl",
      h2: "text-2xl font-semibold md:text-3xl",
      h3: "text-xl font-semibold md:text-2xl",
      h4: "text-lg font-semibold md:text-xl",
      h5: "text-base font-semibold md:text-lg",
      h6: "text-sm font-semibold md:text-base",
    },
  },
  defaultVariants: {
    level: "h1",
  },
})

type HeadingLevel = NonNullable<VariantProps<typeof headingVariants>["level"]>

type HeadingProps = useRender.ComponentProps<HeadingLevel> & { level?: HeadingLevel }

function Heading({ className, level = "h1", render, ...props }: HeadingProps) {
  return useRender({
    defaultTagName: level,
    props: mergeProps<HeadingLevel>(
      {
        className: cn(headingVariants({ level }), className),
      },
      props,
    ),
    render,
    state: {
      slot: "heading",
      level,
    },
  })
}

export { Heading, type HeadingProps, headingVariants }
