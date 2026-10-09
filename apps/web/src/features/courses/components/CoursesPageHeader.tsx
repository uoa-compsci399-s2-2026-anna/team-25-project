import { PageHeader } from "@/features/layout/components"
import { AddCourseTrigger } from "./AddCourseTrigger"
import { CoursesExportButton } from "./CoursesExportButton"
import type { CourseTableRow } from "./CoursesTable"

export const coursesPageHeading = {
  description:
    "How each institution structures its capstone. Convenors update their own entries; the annual review runs each September.",
  title: "Capstone courses",
}

export interface CoursesPageHeaderProps {
  rows: CourseTableRow[]
}

export function CoursesPageHeader({ rows }: CoursesPageHeaderProps) {
  return (
    <PageHeader
      actions={
        <div className="flex items-center gap-3">
          <CoursesExportButton rows={rows} />
          <AddCourseTrigger />
        </div>
      }
      centerOnMobile
      {...coursesPageHeading}
    />
  )
}
