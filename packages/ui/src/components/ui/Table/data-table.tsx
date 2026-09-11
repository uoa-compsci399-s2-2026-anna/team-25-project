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
import type { RowData } from "@tanstack/react-table"
import type { DataTableInstance } from "./hooks/use-data-table"

const ariaSort = {
  asc: "ascending",
  desc: "descending",
} as const

interface DataTableProps<TData extends RowData>
  extends React.ComponentProps<"table">,
    TableVariantProps {
  table: DataTableInstance<TData>
  emptyMessage?: string
}

function DataTable<TData extends RowData>({
  table,
  emptyMessage = "No results.",
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
          rows.map((row) => (
            <TableRow key={row.id}>
              {row.getAllCells().map((cell) => (
                <TableCell className={cn(cell.column.columnDef.meta?.cellClassName)} key={cell.id}>
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

export { DataTable, type DataTableProps }
