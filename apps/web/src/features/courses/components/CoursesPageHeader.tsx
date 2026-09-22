import { Heading } from "@repo/ui/components/ui"
import { AddCourseTrigger } from "./AddCourseTrigger"
import { CoursesExportButton } from "./CoursesExportButton"
import type { CourseTableRow } from "./CoursesTable"

export interface CoursesPageHeaderProps {
  rows: CourseTableRow[]
}

export function CoursesPageHeader({ rows }: CoursesPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 px-10 pt-12 pb-8 md:px-12">
      <Heading level="h1">Capstone courses</Heading>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-8">
        <p className="max-w-2xl text-muted-foreground">
          How each institution structures its capstone. Convenors update their own entries; the
          annual review runs each September.
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <CoursesExportButton rows={rows} />
          <AddCourseTrigger />
        </div>
      </div>
    </div>
  )
}
