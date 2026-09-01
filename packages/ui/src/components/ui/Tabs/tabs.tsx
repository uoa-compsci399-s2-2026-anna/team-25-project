"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cn } from "@repo/ui/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      className={cn("group/tabs flex flex-col gap-2", className)}
      data-slot="tabs"
      {...props}
      orientation="horizontal"
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list relative isolate inline-flex h-8 w-fit items-center justify-center p-[3px] text-muted-foreground",
  {
    variants: {
      variant: {
        pill: "rounded-full bg-muted",
        segmented: "rounded-lg bg-muted",
        outline: "rounded-lg bg-transparent",
        ghost: "rounded-lg bg-transparent",
      },
    },
    defaultVariants: {
      variant: "pill",
    },
  },
)

function TabsList({
  className,
  variant = "pill",
  children,
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      className={cn(tabsListVariants({ variant }), className)}
      data-slot="tabs-list"
      data-variant={variant}
      {...props}
    >
      {children}
      <TabsIndicator />
    </TabsPrimitive.List>
  )
}

function TabsIndicator({ className, ...props }: TabsPrimitive.Indicator.Props) {
  return (
    <TabsPrimitive.Indicator
      className={cn(
        "absolute top-1/2 left-0 -z-10 h-[var(--active-tab-height)] w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)] -translate-y-1/2 transition-[translate,width] duration-200 ease-out motion-reduce:transition-none",
        "group-data-[variant=segmented]/tabs-list:rounded-md group-data-[variant=segmented]/tabs-list:bg-brand-salmon",
        "group-data-[variant=pill]/tabs-list:rounded-full group-data-[variant=pill]/tabs-list:bg-background group-data-[variant=pill]/tabs-list:shadow-sm",
        "group-data-[variant=outline]/tabs-list:rounded-md group-data-[variant=outline]/tabs-list:border group-data-[variant=outline]/tabs-list:border-input group-data-[variant=outline]/tabs-list:bg-background",
        "group-data-[variant=ghost]/tabs-list:rounded-md group-data-[variant=ghost]/tabs-list:bg-muted",
        className,
      )}
      data-slot="tabs-indicator"
      renderBeforeHydration
      {...props}
    />
  )
}

function TabsTrigger({ className, children, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      className={cn(
        "relative grid h-[calc(100%-1px)] flex-1 place-items-center whitespace-nowrap rounded-md border border-transparent px-1.5 py-0.5 font-medium text-foreground/60 text-sm transition-colors hover:text-foreground focus-visible:border-ring focus-visible:outline-1 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-active:text-foreground dark:text-muted-foreground dark:data-active:text-foreground dark:hover:text-foreground [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        "data-active:font-semibold group-data-[variant=pill]/tabs-list:rounded-full",
        "group-data-[variant=segmented]/tabs-list:data-active:text-brand-plum",
        className,
      )}
      data-slot="tabs-trigger"
      {...props}
    >
      {/* Invisible bold twin reserves the active (semibold) width so switching tabs never shifts layout. */}
      <span
        aria-hidden
        className="pointer-events-none invisible col-start-1 row-start-1 inline-flex items-center gap-1.5 font-semibold"
      >
        {children}
      </span>
      <span className="col-start-1 row-start-1 inline-flex items-center gap-1.5">{children}</span>
    </TabsPrimitive.Tab>
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      className={cn("flex-1 text-sm outline-none", className)}
      data-slot="tabs-content"
      {...props}
    />
  )
}

export { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger, tabsListVariants }
