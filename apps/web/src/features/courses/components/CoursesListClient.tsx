"use client"

import { CoursesTable, type CourseTableRow, useCoursesTable } from "./CoursesTable"
import { CoursesToolbar } from "./CoursesToolbar"

export interface CoursesListClientProps {
  rows: CourseTableRow[]
}

/**
 * Owns the table instance so the toolbar's filter/sort/search controls and
 * the table itself share one piece of state, per `CoursesTable`'s own docs
 * (presentation-only there; this - issue #106 - is "the page composing it").
 *
 * All rows load up front and are filtered/sorted in the browser: `pageSize`
 * is set to `Infinity` to opt out of `useDataTable`'s row-pagination feature,
 * since there's no pagination control in the design and a capstone course
 * directory is small enough to not need one.
 */
export function CoursesListClient({ rows }: CoursesListClientProps) {
  const table = useCoursesTable({
    data: rows,
    initialState: { pagination: { pageIndex: 0, pageSize: Number.POSITIVE_INFINITY } },
  })

  return (
    <div className="flex w-full flex-col gap-4 px-10 py-6 md:px-12">
      <CoursesToolbar rows={rows} table={table} />
      <CoursesTable emptyMessage="No courses match these filters." table={table} />
    </div>
  )
}
