import { Skeleton } from "@repo/ui/components/ui"
import { Suspense } from "react"
import { SuspenseSection } from "@/components/SuspenseSection"
import { PageHeaderSkeleton } from "@/features/layout/components"
import {
  getCoursesTableDataCached,
  getMyCoursesSummary,
  getMyDraftCourses,
} from "../courses.queries"
import {
  CoursesListClient,
  CoursesListClientSkeleton,
  ShareMyDraftCourses,
} from "./CoursesListClient"
import { CoursesPageHeader, coursesPageHeading } from "./CoursesPageHeader"
import type { CourseTableRow } from "./CoursesTable"
import { YourCoursesPanel, YourCoursesPanelSkeleton } from "./YourCoursesPanel"

// The header's export needs the same cached rows as the table. It reads them
// on its own, outside the list's boundary, so the header stays up if the list fails.
export async function CoursesHeader() {
  return <CoursesPageHeader rows={await getCoursesTableDataCached()} />
}

export function CoursesHeaderSkeleton() {
  return (
    <PageHeaderSkeleton
      actions={
        // Only the export needs the rows.
        <div className="flex shrink-0 items-center gap-3">
          <Skeleton className="h-9 w-32 rounded-full" />
          <Skeleton className="h-9 w-36 rounded-full" />
        </div>
      }
      centerOnMobile
      {...coursesPageHeading}
    />
  )
}

// The table is cached and looks the same for every viewer, so it can be
// prerendered. It starts as that same published-only list and the viewer's
// own drafts stream into it, and "Your courses" streams in too - both depend
// on whoever's looking.
export async function CoursesList() {
  const rows = await getCoursesTableDataCached()

  return (
    <>
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
      <SuspenseSection
        errorTitle="Could not load your courses"
        errorVariant="card"
        fallback={<YourCoursesPanelSkeleton />}
      >
        <YourCourses rows={rows} />
      </SuspenseSection>
    </>
  )
}

// Drafts are only visible to their owner, so they're read here, outside the
// shared cache, rather than into `rows`. The header's export keeps using the
// published-only `rows`, so it never includes a draft.
async function MyDraftCourses() {
  return <ShareMyDraftCourses drafts={await getMyDraftCourses()} />
}

async function YourCourses({ rows }: { rows: CourseTableRow[] }) {
  // Published rows only, on purpose: drafts already show in the table.
  return <YourCoursesPanel myCourses={await getMyCoursesSummary(rows)} />
}

export function CoursesListSkeleton() {
  return (
    <>
      <CoursesListClientSkeleton />
      <YourCoursesPanelSkeleton />
    </>
  )
}
