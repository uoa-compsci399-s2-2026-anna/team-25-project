import { Suspense } from "react"
import { getCoursesTableDataCached, getMyCoursesSummary } from "../courses.queries"
import { CoursesListClient } from "./CoursesListClient"
import { CoursesPageHeader } from "./CoursesPageHeader"
import { CoursesSummaryPanel } from "./CoursesSummaryPanel"
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
        <Suspense fallback={<CoursesYourEntriesPanelSkeleton />}>
          <YourEntries rows={rows} />
        </Suspense>
      </div>
    </>
  )
}

async function YourEntries({ rows }: { rows: CourseTableRow[] }) {
  const myCourses = await getMyCoursesSummary(rows)
  return <CoursesYourEntriesPanel myCourses={myCourses} />
}
