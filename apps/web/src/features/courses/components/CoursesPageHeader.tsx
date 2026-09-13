import { Button, Heading } from "@repo/ui/components/ui"
import { CoursesExportButton } from "./CoursesExportButton"
import type { CourseTableRow } from "./CoursesTable"

export interface CoursesPageHeaderProps {
  rows: CourseTableRow[]
}

// "Add your course" doesn't do anything yet - the pop-up flow for it is #105.
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
          <Button size="xl" type="button" variant="button-mauve">
            + Add your course
          </Button>
        </div>
      </div>
    </div>
  )
}
