"use client"

import { FilterBarSkeleton } from "@repo/ui/components/composite"
import {
  CoursesTable,
  CoursesTableSkeleton,
  type CourseTableRow,
  useCoursesTable,
} from "./CoursesTable"
import { CoursesToolbar } from "./CoursesToolbar"

export interface CoursesListClientProps {
  rows: CourseTableRow[]
}

// Owns the table instance so the toolbar and the table share the same state.
// All rows load up front and get filtered/sorted in the browser -
// `pageSize: Infinity` opts out of pagination, since the design doesn't have
// any and the directory is small enough not to need it.
// On phones the table bleeds into the side padding so it can scroll to the
// screen edge; `--table-bleed` matches the `px-10` it bleeds through, and
// `--table-inset` sits it at half that from the edge, to fit more columns.
const listClassName =
  "flex w-full flex-col gap-4 px-10 py-6 max-md:[--table-bleed:--spacing(10)] max-md:[--table-inset:--spacing(5)] md:px-12"

export function CoursesListClient({ rows }: CoursesListClientProps) {
  const table = useCoursesTable({
    data: rows,
    initialState: { pagination: { pageIndex: 0, pageSize: Number.POSITIVE_INFINITY } },
  })

  return (
    <div className={listClassName}>
      <CoursesToolbar rows={rows} table={table} />
      <CoursesTable emptyMessage="No courses match these filters." table={table} />
    </div>
  )
}

export function CoursesListClientSkeleton() {
  return (
    <div className={listClassName}>
      <FilterBarSkeleton filterCount={3} statusCount={3} />
      <CoursesTableSkeleton />
    </div>
  )
}
