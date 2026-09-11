"use client"

import { Badge, type BadgeProps } from "@repo/ui/components/ui/Badge/badge"
import { cn } from "@repo/ui/lib/utils"
import type { Column, RowData } from "@tanstack/react-table"
import { cva, type VariantProps } from "class-variance-authority"
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"
import type { DataTableFeatures } from "./data-table-features"

/**
 * One `cva` per visible part, matching `tableVariants` in `table.tsx`. The
 * wrapper of each multi-part cell declares the variants and publishes them as
 * `data-*` on a named group, so the inner parts react through `group-data-*`
 * rather than taking props of their own.
 */
const cellVariants = {
  text: cva("block", {
    variants: {
      tone: {
        default: "text-foreground",
        muted: "text-muted-foreground",
      },
      align: {
        start: "text-left",
        end: "text-right",
      },
    },
    defaultVariants: {
      tone: "default",
      align: "start",
    },
  }),
  stacked: cva("group/stacked-cell flex flex-col gap-0.5", {
    variants: {
      align: {
        start: "items-start text-left",
        end: "items-end text-right",
      },
    },
    defaultVariants: {
      align: "start",
    },
  }),
  stackedPrimary: cva("font-semibold text-foreground"),
  stackedSecondary: cva("text-muted-foreground"),
  sortTrigger: cva(
    "-mx-2 inline-flex items-center [text-transform:inherit] gap-1 rounded-md px-2 py-1 transition-colors hover:bg-brand-blush focus-visible:outline-1 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  ),
  sortIcon: cva("size-3.5 shrink-0", {
    variants: {
      sorted: {
        false: "text-muted-foreground/60",
        true: "text-foreground",
      },
    },
    defaultVariants: {
      sorted: false,
    },
  }),
}

type TextCellProps = React.ComponentProps<"span"> & VariantProps<typeof cellVariants.text>

/** Single-line cell. Use `tone="muted"` for supporting columns. */
function TextCell({ align, className, tone, ...props }: TextCellProps) {
  return (
    <span
      className={cn(cellVariants.text({ tone, align }), className)}
      data-slot="table-text-cell"
      {...props}
    />
  )
}

type StackedCellProps = Omit<React.ComponentProps<"div">, "children"> &
  VariantProps<typeof cellVariants.stacked> & {
    primary: React.ReactNode
    secondary?: React.ReactNode
  }

/**
 * Two-line cell: an emphasised value above a muted one, such as a course title
 * above its lecturer.
 */
function StackedCell({ align, className, primary, secondary, ...props }: StackedCellProps) {
  return (
    <div
      className={cn(cellVariants.stacked({ align }), className)}
      data-align={align ?? "start"}
      data-slot="table-stacked-cell"
      {...props}
    >
      <span className={cellVariants.stackedPrimary()}>{primary}</span>
      {secondary ? <span className={cellVariants.stackedSecondary()}>{secondary}</span> : null}
    </div>
  )
}

/** Single badge in a cell, for short status-like values. */
function BadgeCell({ children, variant = "pink", ...props }: BadgeProps) {
  return (
    <Badge data-slot="table-badge-cell" variant={variant} {...props}>
      {children}
    </Badge>
  )
}

const sortIcons = {
  asc: ArrowUp,
  desc: ArrowDown,
} as const

/**
 * Header that toggles sorting on click. Renders as plain text when the column
 * cannot sort, so it is safe to use for every column.
 */
function SortableHeader<TData extends RowData, TValue>({
  children,
  className,
  column,
}: {
  children: React.ReactNode
  className?: string
  column: Column<DataTableFeatures, TData, TValue>
}) {
  if (!column.getCanSort()) {
    return <>{children}</>
  }

  const direction = column.getIsSorted()
  const Icon = direction ? sortIcons[direction] : ChevronsUpDown

  return (
    <button
      aria-label={`Sort by ${typeof children === "string" ? children : column.id}`}
      className={cn(cellVariants.sortTrigger(), className)}
      data-slot="table-sort-trigger"
      onClick={column.getToggleSortingHandler()}
      type="button"
    >
      {children}
      <Icon aria-hidden className={cellVariants.sortIcon({ sorted: Boolean(direction) })} />
    </button>
  )
}

export {
  BadgeCell,
  cellVariants,
  SortableHeader,
  StackedCell,
  type StackedCellProps,
  TextCell,
  type TextCellProps,
}
