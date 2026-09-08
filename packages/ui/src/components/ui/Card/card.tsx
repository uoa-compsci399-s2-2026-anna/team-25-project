import { cn } from "@repo/ui/lib/utils"
import type * as React from "react"

function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      className={cn(
        "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-lg bg-brand-cream py-(--card-spacing) text-card-foreground text-sm ring-1 ring-foreground/10 [--card-spacing:--spacing(4)] has-[>img:first-child]:pt-0 has-data-[slot=card-footer]:pb-0 data-[size=sm]:[--card-spacing:--spacing(3)] *:[img:first-child]:rounded-t-lg *:[img:last-child]:rounded-b-lg",
        className,
      )}
      data-size={size}
      data-slot="card"
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-lg px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
        className,
      )}
      data-slot="card-header"
      {...props}
    />
  )
}

function CardIcon({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex aspect-square size-10 shrink-0 items-center justify-center [&>svg]:size-full",
        className,
      )}
      data-slot="card-icon"
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "font-bold font-heading text-lg leading-snug group-data-[size=sm]/card:text-sm",
        className,
      )}
      data-slot="card-title"
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-sm", className)} data-slot="card-description" {...props} />
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "col-start-2 row-span-2 row-start-1 flex items-center gap-1 self-start justify-self-end",
        className,
      )}
      data-slot="card-action"
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col items-start px-(--card-spacing)", className)}
      data-slot="card-content"
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mt-auto flex items-end gap-2 rounded-b-lg border-t bg-muted/50 p-(--card-spacing)",
        className,
      )}
      data-slot="card-footer"
      {...props}
    />
  )
}

export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardIcon,
  CardTitle,
}
