import { AnimatedSuspense, Skeleton } from "@repo/ui/components/ui"
import { Suspense } from "react"
import { PageHeaderSkeleton } from "@/features/layout/components"
import {
  getCoursesTableDataCached,
  getMyCoursesSummary,
  getMyDraftCourses,
} from "../courses.queries"
import { AddCourseTriggerButton } from "./AddCourseDialog"
import {
  CoursesListClient,
  CoursesListClientSkeleton,
  ShareMyDraftCourses,
} from "./CoursesListClient"
import { CoursesPageHeader, coursesPageHeading } from "./CoursesPageHeader"
import { CoursesSummaryPanel, CoursesSummaryPanelSkeleton } from "./CoursesSummaryPanel"
import type { CourseTableRow } from "./CoursesTable"
import { CoursesYourEntriesPanel, CoursesYourEntriesPanelSkeleton } from "./CoursesYourEntriesPanel"

// The header and summary are cached and look the same for every viewer, so
// they can be prerendered. The table starts as that same published-only list
// and the viewer's own drafts stream into it, and "Your Entries" streams in
// too - both depend on whoever's looking.
export async function CoursesList() {
  const { rows, summary } = await getCoursesTableDataCached()

  return (
    <>
      <CoursesPageHeader rows={rows} />
      {/* Only the drafts sit behind the boundary, not the table: swapping in a
          second table once they arrived would reset any search, filter or sort
          the viewer had already set on the first. */}
      <CoursesListClient
        draftsSlot={
          <Suspense fallback={null}>
            <MyDraftCourses />
          </Suspense>
        }
        rows={rows}
      />
      <div className="grid w-full gap-4 px-10 pt-6 pb-10 md:grid-cols-2 md:px-12">
        <CoursesSummaryPanel summary={summary} />
        <AnimatedSuspense fallback={<CoursesYourEntriesPanelSkeleton />}>
          <YourEntries rows={rows} />
        </AnimatedSuspense>
      </div>
    </>
  )
}

// Drafts are only visible to their owner, so they're read here, outside the
// shared cache, rather than into `rows`. The header's export and the summary
// keep using the published-only `rows`, so neither counts a draft.
async function MyDraftCourses() {
  return <ShareMyDraftCourses drafts={await getMyDraftCourses()} />
}

async function YourEntries({ rows }: { rows: CourseTableRow[] }) {
  // Published rows only, on purpose: the summary's total already counts every
  // course the member owns, drafts included, and a draft can never be "up to date".
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
