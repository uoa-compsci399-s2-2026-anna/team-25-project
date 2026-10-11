"use client"

import { FilterBar, type FilterBarFilter } from "@repo/ui/components/composite"
import { useState } from "react"
import type { CoursesTableInstance, CourseTableRow } from "./CoursesTable"

type CourseStatusFilter = "all" | CourseTableRow["status"]

type SortKey = "course-asc" | "year-desc" | "year-asc"

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "course-asc", label: "Course (A–Z)" },
  { value: "year-desc", label: "Year: Newest first" },
  { value: "year-asc", label: "Year: Oldest first" },
]

// `SortableHeader` already lets you click a column to sort it - this
// dropdown just offers a few common presets through that same `toggleSorting` API.
const sortConfig: Record<SortKey, { columnId: string; desc: boolean }> = {
  "course-asc": { columnId: "course", desc: false },
  "year-desc": { columnId: "year", desc: true },
  "year-asc": { columnId: "year", desc: false },
}

const uniqueSorted = (values: Array<string>) => Array.from(new Set(values)).sort()

/**
 * Lays the bar out as on the proposals page: on phones the dropdowns shrink so
 * they fit on fewer rows, with `groupControls` they wrap as one centred group,
 * and from 1080px the group moves to the right of the search. Shared with the
 * loading skeleton so it doesn't jump once the bar loads.
 *
 * Courses has one more dropdown than proposals, so from 1080px the search (the
 * second child, in the skeleton too) shrinks to fit the row instead of pushing
 * the group onto a row of its own: measured at 1080px wide, the group wrapped
 * and sat right while the tabs and search sat left until about 1220px.
 */
export const coursesFilterBarClassName = [
  "min-[1080px]:justify-start! max-md:justify-center md:flex-wrap md:justify-center md:gap-2",
  "max-md:[&_[data-slot=select-trigger]]:px-2 max-md:[&_[data-slot=select-trigger]]:text-xs",
  "min-[1080px]:[&>:nth-child(2)]:w-auto min-[1080px]:[&>:nth-child(2)]:max-w-80 min-[1080px]:[&>:nth-child(2)]:flex-1 min-[1080px]:[&>:nth-child(2)]:basis-0",
].join(" ")

export interface CoursesToolbarProps {
  table: CoursesTableInstance
  /** The full, unfiltered row set, so the filter option lists don't shrink
   * as other filters narrow what's on screen. */
  rows: CourseTableRow[]
}

export function CoursesToolbar({ table, rows }: CoursesToolbarProps) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<CourseStatusFilter>("all")
  const [university, setUniversity] = useState<string | null>(null)
  const [semester, setSemester] = useState<string | null>(null)
  const [year, setYear] = useState<number | null>(null)

  // This is derived from the table rather than tracked in its own state,
  // because a column header can change the sort independently of this
  // dropdown - reading it back through the same `getIsSorted` API keeps the
  // two from drifting out of sync.
  const sort =
    (Object.keys(sortConfig) as SortKey[]).find((key) => {
      const { columnId, desc } = sortConfig[key]
      const direction = table.getColumn(columnId)?.getIsSorted()
      return direction === (desc ? "desc" : "asc")
    }) ?? "course-asc"

  // A course with no offering yet gets the `year: 0` / `semester: "—"`
  // placeholders from `splitPeriod`, which aren't real values to filter by.
  const coursesWithOfferings = rows.filter((row) => row.year !== 0)

  const universityOptions = uniqueSorted(rows.map((row) => row.university)).map((value) => ({
    label: value,
    value,
  }))
  const semesterOptions = uniqueSorted(coursesWithOfferings.map((row) => row.semester)).map(
    (value) => ({ label: value, value }),
  )
  const yearOptions = Array.from(new Set(coursesWithOfferings.map((row) => row.year)))
    .sort((a, b) => b - a)
    .map((value) => ({ label: String(value), value }))
  const statusCounts = {
    all: rows.length,
    draft: rows.filter((row) => row.status === "draft").length,
    published: rows.filter((row) => row.status === "published").length,
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    table.getColumn("course")?.setFilterValue(value || undefined)
  }

  const handleUniversityChange = (value: string | null) => {
    setUniversity(value)
    table.getColumn("university")?.setFilterValue(value === null ? undefined : [value])
  }

  const handleSemesterChange = (value: string | null) => {
    setSemester(value)
    table.getColumn("semester")?.setFilterValue(value === null ? undefined : [value])
  }

  const handleYearChange = (value: number | null) => {
    setYear(value)
    table.getColumn("year")?.setFilterValue(value === null ? undefined : [value])
  }

  const handleStatusChange = (value: CourseStatusFilter) => {
    setStatus(value)
    table.getColumn("status")?.setFilterValue(value === "all" ? undefined : [value])
  }

  const handleSortChange = (value: SortKey) => {
    const { columnId, desc } = sortConfig[value]
    table.getColumn(columnId)?.toggleSorting(desc, false)
  }

  return (
    <FilterBar
      className={coursesFilterBarClassName}
      filters={[
        {
          id: "university",
          onValueChange: handleUniversityChange,
          options: universityOptions,
          placeholder: "University",
          value: university,
        } satisfies FilterBarFilter<string>,
        {
          id: "semester",
          onValueChange: handleSemesterChange,
          options: semesterOptions,
          placeholder: "Semester",
          value: semester,
        } satisfies FilterBarFilter<string>,
        {
          id: "year",
          onValueChange: handleYearChange,
          options: yearOptions,
          placeholder: "Year",
          value: year,
        } satisfies FilterBarFilter<number>,
      ]}
      groupControls
      onSearchChange={handleSearchChange}
      onSortChange={handleSortChange}
      onStatusChange={handleStatusChange}
      search={search}
      searchPlaceholder="Search courses..."
      sort={sort}
      sortOptions={sortOptions}
      status={status}
      statusOptions={[
        { label: "All", value: "all", count: statusCounts.all },
        { label: "Published", value: "published", count: statusCounts.published },
        { label: "Draft", value: "draft", count: statusCounts.draft },
      ]}
    />
  )
}
