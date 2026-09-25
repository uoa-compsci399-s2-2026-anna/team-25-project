import { PageHeader } from "@/components/PageHeader"
import { AddCourseTrigger } from "./AddCourseTrigger"
import { CoursesExportButton } from "./CoursesExportButton"
import type { CourseTableRow } from "./CoursesTable"

export interface CoursesPageHeaderProps {
  rows: CourseTableRow[]
}

export function CoursesPageHeader({ rows }: CoursesPageHeaderProps) {
  return (
    <PageHeader
      actions={
        <div className="flex shrink-0 items-center gap-3">
          <CoursesExportButton rows={rows} />
          <AddCourseTrigger />
        </div>
      }
      description="How each institution structures its capstone. Convenors update their own entries; the annual review runs each September."
      title="Capstone courses"
    />
  )
}
