import { Button, Heading } from "@repo/ui/components/ui"
import { CoursesExportButton } from "./CoursesExportButton"
import type { CourseTableRow } from "./CoursesTable"

export interface CoursesPageHeaderProps {
  rows: CourseTableRow[]
}

/**
 * The "Add your course" button doesn't open anything yet - the pop-up flow
 * behind it is being built separately in #105.
 */
export function CoursesPageHeader({ rows }: CoursesPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 px-10 pt-12 pb-8 md:flex-row md:items-start md:justify-between md:gap-8 md:px-12">
      <div className="flex flex-col gap-2">
        <Heading level="h1">Capstone courses</Heading>
        <p className="max-w-2xl text-muted-foreground">
          How each institution structures its capstone. Convenors update their own entries; the
          annual review runs each September.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <CoursesExportButton rows={rows} />
        <Button size="xl" type="button" variant="button-mauve">
          + Add your course
        </Button>
      </div>
    </div>
  )
}
