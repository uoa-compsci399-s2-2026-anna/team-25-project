"use client"

import { Button } from "@repo/ui/components/ui"
import { coursesToCsv } from "../courses.csv"
import type { CourseTableRow } from "./CoursesTable"

const todayStamp = () => new Date().toISOString().slice(0, 10)

export interface CoursesExportButtonProps {
  rows: CourseTableRow[]
}

/**
 * Exports the full directory, not just what the toolbar's filters currently
 * narrow the table to - it lives in the page header (`CoursesPageHeader`),
 * alongside "Add your course", separate from the table's own live filter
 * state.
 */
export function CoursesExportButton({ rows }: CoursesExportButtonProps) {
  const handleExport = () => {
    const blob = new Blob([coursesToCsv(rows)], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = `capstone-courses-${todayStamp()}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Button
      borderColor="charcoal"
      onClick={handleExport}
      size="xl"
      type="button"
      variant="button-white"
    >
      Export CSV
    </Button>
  )
}
