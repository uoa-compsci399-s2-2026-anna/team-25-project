"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type TableVariantProps,
} from "@repo/ui/components/ui/Table/table"
import { cn } from "@repo/ui/lib/utils"
import type { Row, RowData } from "@tanstack/react-table"
import type { DataTableFeatures } from "./data-table-features"
import type { DataTableInstance } from "./hooks/use-data-table"

const ariaSort = {
  asc: "ascending",
  desc: "descending",
} as const

/**
 * True when the event originated on, or inside, a real interactive element -
 * a link, button, input, select, or textarea. Pair with `getRowProps` to
 * avoid double-handling a row's own click/keydown when the event already
 * landed on a real interactive descendant (e.g. a `Link` rendered inside a
 * cell for accessibility/middle-click) that handles itself.
 */
function isInteractiveDescendant(event: { target: EventTarget | null }): boolean {
  return (event.target as HTMLElement | null)?.closest("a, button, input, select, textarea") != null
}

interface DataTableProps<TData extends RowData>
  extends React.ComponentProps<"table">,
    TableVariantProps {
  table: DataTableInstance<TData>
  emptyMessage?: string
  /**
   * Extra DOM props for each body row, e.g. `onClick` and `className` to make
   * a row navigate. `DataTable` only forwards them - it has no notion of
   * navigation itself, so the consumer supplies real anchors/routing.
   */
  getRowProps?: (row: Row<DataTableFeatures, TData>) => React.ComponentPropsWithRef<"tr">
}

function DataTable<TData extends RowData>({
  table,
  emptyMessage = "No results.",
  getRowProps,
  ...props
}: DataTableProps<TData>) {
  const rows = table.getRowModel().rows

  return (
    <Table {...props}>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              // A placeholder shares its leaf column, so only the real header
              // reports the sort.
              const direction = header.isPlaceholder ? false : header.column.getIsSorted()
              return (
                <TableHead
                  aria-sort={direction ? ariaSort[direction] : undefined}
                  colSpan={header.colSpan}
                  key={header.id}
                >
                  {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                </TableHead>
              )
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              className="h-24 text-center text-muted-foreground"
              colSpan={table.getAllLeafColumns().length}
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => {
            const { className: rowClassName, ...rowProps } = getRowProps?.(row) ?? {}
            return (
              <TableRow className={cn(rowClassName)} key={row.id} {...rowProps}>
                {row.getAllCells().map((cell) => (
                  <TableCell
                    className={cn(cell.column.columnDef.meta?.cellClassName)}
                    key={cell.id}
                  >
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            )
          })
        )}
      </TableBody>
    </Table>
  )
}

export { DataTable, type DataTableProps, isInteractiveDescendant }
