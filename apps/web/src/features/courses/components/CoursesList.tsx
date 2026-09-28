import { AnimatedSuspense } from "@repo/ui/components/ui"
import { getCoursesTableDataCached, getMyCoursesSummary } from "../courses.queries"
import { CoursesListClient, CoursesListClientSkeleton } from "./CoursesListClient"
import { CoursesPageHeader, CoursesPageHeaderSkeleton } from "./CoursesPageHeader"
import { CoursesSummaryPanel, CoursesSummaryPanelSkeleton } from "./CoursesSummaryPanel"
import type { CourseTableRow } from "./CoursesTable"
import { CoursesYourEntriesPanel, CoursesYourEntriesPanelSkeleton } from "./CoursesYourEntriesPanel"

// The header, table, and summary are cached and look the same for every
// viewer, so they can be prerendered - "Your Entries" depends on whoever's
// looking, so it streams in afterward.
export async function CoursesList() {
  const { rows, summary } = await getCoursesTableDataCached()

  return (
    <>
      <CoursesPageHeader rows={rows} />
      <CoursesListClient rows={rows} />
      <div className="grid w-full gap-4 px-10 pt-6 pb-10 md:grid-cols-2 md:px-12">
        <CoursesSummaryPanel summary={summary} />
        <AnimatedSuspense fallback={<CoursesYourEntriesPanelSkeleton />}>
          <YourEntries rows={rows} />
        </AnimatedSuspense>
      </div>
    </>
  )
}

async function YourEntries({ rows }: { rows: CourseTableRow[] }) {
  const myCourses = await getMyCoursesSummary(rows)
  return <CoursesYourEntriesPanel myCourses={myCourses} />
}

export function CoursesListSkeleton() {
  return (
    <>
      <CoursesPageHeaderSkeleton />
      <CoursesListClientSkeleton />
      <div className="grid w-full gap-4 px-10 pt-6 pb-10 md:grid-cols-2 md:px-12">
        <CoursesSummaryPanelSkeleton />
        <CoursesYourEntriesPanelSkeleton />
      </div>
    </>
  )
}
