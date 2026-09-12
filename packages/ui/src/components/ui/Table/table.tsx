"use client"

import { cn } from "@repo/ui/lib/utils"
import type * as React from "react"
import { type TableVariantProps, tableVariants } from "./table.variants"

function Table({
  className,
  containerClassName,
  density = "comfortable",
  striped = false,
  ...props
}: React.ComponentProps<"table"> &
  TableVariantProps & {
    /** Classes for the scrolling wrapper, which owns the container styling. */
    containerClassName?: string
  }) {
  return (
    <div
      className={cn(tableVariants.container({ density, striped }), containerClassName)}
      data-density={density}
      data-slot="table-container"
      data-striped={striped}
    >
      <table
        className={cn(tableVariants.root(), className, "rounded-5")}
        data-slot="table"
        {...props}
      />
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
  TableRow,
  type TableVariantProps,
}
