"use client"

import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { cn } from "@repo/ui/lib/utils"
import { XIcon } from "lucide-react"
import { Button } from "../Button/button"

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverPortal({ ...props }: PopoverPrimitive.Portal.Props) {
  return <PopoverPrimitive.Portal data-slot="popover-portal" {...props} />
}

function PopoverClose({ ...props }: PopoverPrimitive.Close.Props) {
  return <PopoverPrimitive.Close data-slot="popover-close" {...props} />
}

function PopoverContent({
  className,
  children,
  sideOffset = 8,
  side,
  align = "start",
  alignOffset,
  collisionAvoidance,
  showCloseButton = false,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    "side" | "sideOffset" | "align" | "alignOffset" | "collisionAvoidance"
  > & {
    showCloseButton?: boolean
  }) {
  return (
    <PopoverPortal>
      {/* The positioner is what gets portaled to the body, so the z-index
          belongs here - on the popup it can't lift the popover above a
          sticky header that sets its own z-index. */}
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        className="z-50"
        collisionAvoidance={collisionAvoidance}
        side={side}
        sideOffset={sideOffset}
      >
        <PopoverPrimitive.Popup
          className={cn(
            "data-closed:fade-out-0 data-closed:zoom-out-95 data-open:fade-in-0 data-open:zoom-in-95 w-72 origin-(--transform-origin) rounded-xl border border-brand-border bg-popover p-4 text-popover-foreground text-sm shadow-md outline-none duration-100 data-closed:animate-out data-open:animate-in",
            className,
          )}
          data-slot="popover-content"
          {...props}
        >
          {children}
          {showCloseButton && (
            <PopoverClose
              render={
                <Button
                  className="absolute top-2 right-2"
                  size="icon-sm"
                  type="button"
                  variant="button-transparent"
                />
              }
            >
              <XIcon aria-hidden="true" />
              <span className="sr-only">Close popover</span>
            </PopoverClose>
          )}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPortal>
  )
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return (
    <PopoverPrimitive.Title
      className={cn("font-heading font-medium text-base leading-none", className)}
      data-slot="popover-title"
      {...props}
    />
  )
}

function PopoverDescription({ className, ...props }: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      className={cn("text-muted-foreground text-sm", className)}
      data-slot="popover-description"
      {...props}
    />
  )
}

export {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverPortal,
  PopoverTitle,
  PopoverTrigger,
}
