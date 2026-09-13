"use client"

import { CoursesTable, type CourseTableRow, useCoursesTable } from "./CoursesTable"
import { CoursesToolbar } from "./CoursesToolbar"

export interface CoursesListClientProps {
  rows: CourseTableRow[]
}

// Owns the table instance so the toolbar and the table share the same state.
// All rows load up front and get filtered/sorted in the browser -
// `pageSize: Infinity` opts out of pagination, since the design doesn't have
// any and the directory is small enough not to need it.
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
