import {
  columnFacetingFeature,
  columnFilteringFeature,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_arrHas,
  filterFn_equals,
  filterFn_includesString,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
} from "@tanstack/react-table"

/** Per-column presentation hints, read by `DataTable` when rendering cells. */
export interface DataTableColumnMeta {
  /** Extra classes for every `<td>` in the column, e.g. `"text-right"`. */
  cellClassName?: string
}

export const features = tableFeatures({
  columnFacetingFeature,
  columnFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: {
    // Multi-select filter chips hold an array of selected values, matched
    // against a scalar cell value. `arrIncludesSome` is the wrong one here: it
    // requires the *cell* to be an array and drops every row otherwise.
    arrHas: filterFn_arrHas,
    equals: filterFn_equals,
    includesString: filterFn_includesString,
  },
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
  // Phantom value: only its type is used, to type `columnDef.meta`.
  columnMeta: {} as DataTableColumnMeta,
})

// Pass this as the first generic argument to `ColumnDef`, `Column`, `Table`,
// and `Row` so each type knows which feature APIs are available.
export type DataTableFeatures = typeof features
