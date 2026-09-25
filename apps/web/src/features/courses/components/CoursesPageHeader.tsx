import { Heading, Skeleton } from "@repo/ui/components/ui"
import { PageHeader } from "@/features/layout/components"
import { AddCourseTriggerButton } from "./AddCourseDialog"
import { AddCourseTrigger } from "./AddCourseTrigger"
import { CoursesExportButton } from "./CoursesExportButton"
import type { CourseTableRow } from "./CoursesTable"

const intro =
  "How each institution structures its capstone. Convenors update their own entries; the annual review runs each September."

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
      description="How each institution structures its capstone. Convenors update their own entries; the annual review runs each September."
      title="Capstone courses"
    />
  )
}

// Only the export needs the rows; the rest of the header is static.
export function CoursesPageHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-10 pt-12 pb-8 md:px-12">
      <Heading level="h1">Capstone courses</Heading>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-8">
        <p className="max-w-2xl text-muted-foreground">{intro}</p>
        <div className="flex shrink-0 items-center gap-3">
          <Skeleton className="h-11 w-32 rounded-full" />
          <AddCourseTriggerButton />
        </div>
      </div>
    </div>
  )
}
