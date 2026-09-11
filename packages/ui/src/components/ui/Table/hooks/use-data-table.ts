"use client"

import type { ColumnDef, RowData, TableState } from "@tanstack/react-table"
import { useTable } from "@tanstack/react-table"
import { type DataTableFeatures, features } from "../data-table-features"

interface UseDataTableOptions<TData extends RowData> {
  columns: Array<ColumnDef<DataTableFeatures, TData, unknown>>
  data: Array<TData>
  /** Starting sort, filters, or page size. The table owns the state after mount. */
  initialState?: Partial<TableState<DataTableFeatures>>
}

/**
 * Builds the table instance. Kept separate from `DataTable` so a page can render
 * filter controls and result counts outside the table while sharing one instance
 */
function useDataTable<TData extends RowData>({
  columns,
  data,
  initialState,
}: UseDataTableOptions<TData>) {
  return useTable({ features, columns, data, initialState })
}

type DataTableInstance<TData extends RowData> = ReturnType<typeof useDataTable<TData>>

export { type DataTableInstance, type UseDataTableOptions, useDataTable }
