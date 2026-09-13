"use client"

import { FilterBar, type FilterBarFilter } from "@repo/ui/components/composite"
import { useMemo, useState } from "react"
import type { CoursesTableInstance, CourseTableRow } from "./CoursesTable"

type CourseStatusFilter = "all" | CourseTableRow["status"]

type SortKey = "course-asc" | "year-desc" | "year-asc"

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "course-asc", label: "Course (A–Z)" },
  { value: "year-desc", label: "Year: Newest first" },
  { value: "year-asc", label: "Year: Oldest first" },
]

// `SortableHeader` lets a click toggle any single column; this dropdown just
// offers a few common presets through the same `toggleSorting` API.
const sortConfig: Record<SortKey, { columnId: string; desc: boolean }> = {
  "course-asc": { columnId: "course", desc: false },
  "year-desc": { columnId: "year", desc: true },
  "year-asc": { columnId: "year", desc: false },
}

const uniqueSorted = (values: Array<string>) => Array.from(new Set(values)).sort()

export interface CoursesToolbarProps {
  table: CoursesTableInstance
  /** The full, unfiltered row set - keeps filter option lists from shrinking
   * as other filters narrow what's on screen. */
  rows: CourseTableRow[]
}

export function CoursesToolbar({ table, rows }: CoursesToolbarProps) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<CourseStatusFilter>("all")
  const [university, setUniversity] = useState<string | null>(null)
  const [semester, setSemester] = useState<string | null>(null)
  const [year, setYear] = useState<number | null>(null)

  // Derived, not local state: a table column header (`SortableHeader`) can
  // change the table's sort independently of this dropdown, so the dropdown
  // reads each preset's own column via the same `getIsSorted` API
  // `SortableHeader` uses, instead of tracking its own copy that could drift
  // out of sync with a header click.
  const sort =
    (Object.keys(sortConfig) as SortKey[]).find((key) => {
      const { columnId, desc } = sortConfig[key]
      const direction = table.getColumn(columnId)?.getIsSorted()
      return direction === (desc ? "desc" : "asc")
    }) ?? "course-asc"

  // A course with no offering yet gets the `year: 0` / `semester: "—"`
  // placeholders `splitPeriod` falls back to (see `courses.format.ts`) -
  // real, but not a filterable value, so both option lists exclude them.
  const coursesWithOfferings = useMemo(() => rows.filter((row) => row.year !== 0), [rows])

  const universityOptions = useMemo(
    () => uniqueSorted(rows.map((row) => row.university)).map((value) => ({ label: value, value })),
    [rows],
  )
  const semesterOptions = useMemo(
    () =>
      uniqueSorted(coursesWithOfferings.map((row) => row.semester)).map((value) => ({
        label: value,
        value,
      })),
    [coursesWithOfferings],
  )
  const yearOptions = useMemo(
    () =>
      Array.from(new Set(coursesWithOfferings.map((row) => row.year)))
        .sort((a, b) => b - a)
        .map((value) => ({ label: String(value), value })),
    [coursesWithOfferings],
  )
  const statusCounts = useMemo(
    () => ({
      all: rows.length,
      draft: rows.filter((row) => row.status === "draft").length,
      published: rows.filter((row) => row.status === "published").length,
    }),
    [rows],
  )

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
