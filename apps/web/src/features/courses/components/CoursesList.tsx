import { AnimatedSuspense, Skeleton } from "@repo/ui/components/ui"
import { PageHeaderSkeleton } from "@/features/layout/components"
import {
  getCoursesTableDataCached,
  getMyCoursesSummary,
  getMyDraftCourseRows,
} from "../courses.queries"
import { AddCourseTriggerButton } from "./AddCourseDialog"
import { CoursesListClient, CoursesListClientSkeleton } from "./CoursesListClient"
import { CoursesPageHeader, coursesPageHeading } from "./CoursesPageHeader"
import { CoursesSummaryPanel, CoursesSummaryPanelSkeleton } from "./CoursesSummaryPanel"
import type { CourseTableRow } from "./CoursesTable"
import { CoursesYourEntriesPanel, CoursesYourEntriesPanelSkeleton } from "./CoursesYourEntriesPanel"

// The header and summary are cached and look the same for every viewer, so
// they can be prerendered. The table starts as that same published-only list,
// then streams in again with the viewer's own drafts added, and "Your Entries"
// streams in too - both depend on whoever's looking.
export async function CoursesList() {
  const { rows, summary } = await getCoursesTableDataCached()

  return (
    <>
      <CoursesPageHeader rows={rows} />
      <AnimatedSuspense fallback={<CoursesListClient rows={rows} />}>
        <CoursesWithMyDrafts rows={rows} />
      </AnimatedSuspense>
      <div className="grid w-full gap-4 px-10 pt-6 pb-10 md:grid-cols-2 md:px-12">
        <CoursesSummaryPanel summary={summary} />
        <AnimatedSuspense fallback={<CoursesYourEntriesPanelSkeleton />}>
          <YourEntries rows={rows} />
        </AnimatedSuspense>
      </div>
    </>
  )
}

// Drafts are only visible to their owner, so they're merged in here, outside the
// shared cache, rather than into `rows`. The header's export and the summary
// keep using the published-only `rows`, so neither counts a draft.
async function CoursesWithMyDrafts({ rows }: { rows: CourseTableRow[] }) {
  const drafts = await getMyDraftCourseRows()
  return <CoursesListClient rows={[...rows, ...drafts]} />
}

async function YourEntries({ rows }: { rows: CourseTableRow[] }) {
  const myCourses = await getMyCoursesSummary(rows)
  return <CoursesYourEntriesPanel myCourses={myCourses} />
}

export function CoursesListSkeleton() {
  return (
    <>
      <PageHeaderSkeleton
        actions={
          // Only the export needs the rows; the add button needs no data.
          <div className="flex shrink-0 items-center gap-3">
            <Skeleton className="h-9 w-32 rounded-full" />
            <AddCourseTriggerButton />
          </div>
        }
        {...coursesPageHeading}
      />
      <CoursesListClientSkeleton />
      <div className="grid w-full gap-4 px-10 pt-6 pb-10 md:grid-cols-2 md:px-12">
        <CoursesSummaryPanelSkeleton />
        <CoursesYourEntriesPanelSkeleton />
      </div>
    </>
  )
}
