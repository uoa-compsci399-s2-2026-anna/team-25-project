"use client"

import { cn } from "@repo/ui/lib/utils"
import { ArrowRightIcon } from "lucide-react"
import type * as React from "react"
import { useRef } from "react"
import { useScrollOverflow } from "./hooks/use-scroll-overflow"
import { type TableVariantProps, tableVariants } from "./table.variants"

type TableProps = React.ComponentProps<"table"> &
  TableVariantProps & {
    /** Classes for the scrolling wrapper. */
    containerClassName?: string
    /** Names the scrolling region for screen readers, e.g. "Courses". */
    scrollLabel?: string
  }

function Table({
  className,
  containerClassName,
  density = "comfortable",
  scrollLabel = "Table",
  striped = false,
  ...props
}: TableProps) {
  const containerRef = useRef<HTMLElement>(null)
  // Fades whichever edge has more columns past it, so a table too wide for the
  // screen reads as scrollable rather than cut off.
  const overflow = useScrollOverflow(containerRef)

  return (
    <div className={tableVariants.wrapper()} data-slot="table-wrapper">
      <section
        // A labelled, focusable region (a named <section>) lets keyboard users
        // scroll with the arrow keys, as most rows have no link or button to tab
        // into. Only while there is something to scroll, so a table that fits
        // adds no tab stop.
        aria-label={scrollLabel}
        className={cn(tableVariants.container({ density, striped }), containerClassName)}
        data-density={density}
        data-overflow-end={overflow.end}
        data-overflow-start={overflow.start}
        data-slot="table-container"
        data-striped={striped}
        ref={containerRef}
        tabIndex={overflow.start || overflow.end ? 0 : undefined}
      >
        <div className={tableVariants.card()} data-slot="table-card">
          <table
            className={cn(tableVariants.root(), className, "rounded-5")}
            data-slot="table"
            {...props}
          />
        </div>
      </section>
      {/* Decorative: the fade says the same thing, and screen readers move by cell. */}
      <p aria-hidden className={tableVariants.hint()} data-slot="table-scroll-hint">
        Scroll for more
        <ArrowRightIcon />
      </p>
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead className={cn(tableVariants.header(), className)} data-slot="table-header" {...props} />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody className={cn(tableVariants.body(), className)} data-slot="table-body" {...props} />
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot className={cn(tableVariants.footer(), className)} data-slot="table-footer" {...props} />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return <tr className={cn(tableVariants.row(), className)} data-slot="table-row" {...props} />
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return <th className={cn(tableVariants.head(), className)} data-slot="table-head" {...props} />
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return <td className={cn(tableVariants.cell(), className)} data-slot="table-cell" {...props} />
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption
      className={cn(tableVariants.caption(), className)}
      data-slot="table-caption"
      {...props}
    />
  )
}

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  type TableProps,
  TableRow,
  type TableVariantProps,
}
