"use client"

import { cn } from "@repo/ui/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import type * as React from "react"
import { Button } from "../Button/button"
import { Input } from "../Input/input"
import { TextArea } from "../TextArea/textarea"

const inputGroupVariants = cva(
  "group/input-group relative flex h-8 w-full min-w-0 items-center border outline-none transition-colors in-data-[slot=combobox-content]:focus-within:border-inherit in-data-[slot=combobox-content]:focus-within:ring-0 has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-start]]:h-auto has-[>textarea]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:flex-col has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot][aria-invalid=true]]:border-destructive has-disabled:bg-input/50 has-disabled:opacity-50 has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50 has-[[data-slot][aria-invalid=true]]:ring-3 has-[[data-slot][aria-invalid=true]]:ring-destructive/20 has-[>[data-align=block-end]]:[&>input]:pt-3 has-[>[data-align=inline-end]]:[&>input]:pr-1.5 has-[>[data-align=block-start]]:[&>input]:pb-3 has-[>[data-align=inline-start]]:[&>input]:pl-1.5",
  {
    variants: {
      variant: {
        // Form fields on the register page: 8px radius, translucent cream fill, grey hairline.
        field:
          "rounded-lg border-brand-border bg-brand-cream/60 [&_[data-slot=input-group-control]]:px-2.5",
        // Filter chips on the capstone courses page: full radius, no fill, faint hairline.
        pill: "rounded-full border-foreground/15 bg-transparent [&_[data-slot=input-group-control]]:px-5",
      },
    },
    defaultVariants: {
      variant: "field",
    },
  },
)

function InputGroup({
  className,
  variant = "field",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupVariants>) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: role="group" wraps a single control with its addons; <fieldset> is reserved for FieldSet, which groups multiple fields under one legend
    <div
      {...props}
      className={cn(inputGroupVariants({ variant }), className)}
      data-slot="input-group"
      data-variant={variant}
      role="group"
    />
  )
}

// Anything the pointer may have been aiming at in its own right. Clicking one of these
// must not bounce focus over to the control.
const INTERACTIVE_SELECTOR =
  "button, a[href], input, select, textarea, label, [role=button], [tabindex]:not([tabindex='-1'])"

const inputGroupAddonVariants = cva(
  "flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium text-muted-foreground select-none group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-4",
  {
    variants: {
      align: {
        "inline-start": "order-first pl-2 has-[>button]:ml-[-0.3rem] has-[>kbd]:ml-[-0.15rem]",
        "inline-end": "order-last pr-2 has-[>button]:mr-[-0.3rem] has-[>kbd]:mr-[-0.15rem]",
        "block-start":
          "order-first w-full justify-start px-2.5 pt-2 group-has-[>input]/input-group:pt-2 [.border-b]:pb-2",
        "block-end":
          "order-last w-full justify-start px-2.5 pb-2 group-has-[>input]/input-group:pb-2 [.border-t]:pt-2",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  },
)

function InputGroupAddon({
  className,
  align = "inline-start",
  onClick,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    // The addon is a decorative slot, not a control: it carries no role of its own, so the
    // outer InputGroup stays the only group boundary in the accessibility tree.
    // biome-ignore lint/a11y/useKeyWithClickEvents: click-to-focus is a pointer affordance only; keyboard users reach the control by tabbing to it directly
    // biome-ignore lint/a11y/noStaticElementInteractions: same — the handler adds no behavior a keyboard user cannot get by tabbing to the control
    <div
      {...props}
      className={cn(inputGroupAddonVariants({ align }), className)}
      data-align={align}
      data-slot="input-group-addon"
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented || (e.target as HTMLElement).closest(INTERACTIVE_SELECTOR)) {
          return
        }
        // Reach up to the group rather than to the immediate parent, so the addon keeps
        // working when a consumer wraps it, and target the control by slot so a textarea
        // group focuses too — a bare `input` lookup also grabs any input inside the addon.
        e.currentTarget
          .closest("[data-slot=input-group]")
          ?.querySelector<HTMLElement>("[data-slot=input-group-control]")
          ?.focus()
      }}
    />
  )
}

const inputGroupButtonVariants = cva("flex items-center gap-2 text-sm shadow-none", {
  variants: {
    size: {
      xs: "h-6 gap-1 px-1.5 [&>svg:not([class*='size-'])]:size-3.5",
      sm: "",
      "icon-xs": "size-6 p-0 has-[>svg]:p-0 [&>svg:not([class*='size-'])]:size-3.5",
      "icon-sm": "size-8 p-0 has-[>svg]:p-0 [&>svg:not([class*='size-'])]:size-3.5",
    },
  },
  defaultVariants: {
    size: "xs",
  },
})

type InputGroupButtonSize = NonNullable<VariantProps<typeof inputGroupButtonVariants>["size"]>

// An input group runs on its own size scale, so pick the Button size whose geometry each
// group size is built on. Without this the Button falls back to `md` and the group's
// classes only win by class-merge ordering.
const buttonSizeForGroupSize = {
  xs: "sm",
  sm: "md",
  "icon-xs": "icon-xs",
  "icon-sm": "icon",
} as const satisfies Record<InputGroupButtonSize, React.ComponentProps<typeof Button>["size"]>

function InputGroupButton({
  className,
  type = "button",
  variant = "button-transparent",
  size = "xs",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size"> & {
  // Narrower than cva's own VariantProps, which also admits `null` — a value that would
  // strip the size classes and leave the button unmapped.
  size?: InputGroupButtonSize
}) {
  return (
    <Button
      className={cn(inputGroupButtonVariants({ size }), className)}
      data-size={size}
      size={buttonSizeForGroupSize[size]}
      type={type}
      variant={variant}
      {...props}
    />
  )
}

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 text-muted-foreground text-sm [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none",
        className,
      )}
      data-slot="input-group-text"
      {...props}
    />
  )
}

function InputGroupInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <Input
      className={cn(
        "flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent",
        className,
      )}
      data-slot="input-group-control"
      {...props}
    />
  )
}

function InputGroupTextarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <TextArea
      className={cn(
        "flex-1 resize-none rounded-none border-0 bg-transparent py-2 shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent",
        className,
      )}
      data-slot="input-group-control"
      {...props}
    />
  )
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
  inputGroupVariants,
}
