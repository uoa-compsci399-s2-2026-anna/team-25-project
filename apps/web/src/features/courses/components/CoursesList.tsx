import { getCoursesPageData } from "../courses.queries"
import { CoursesListClient } from "./CoursesListClient"
import { CoursesPageHeader } from "./CoursesPageHeader"
import { CoursesSummaryPanel } from "./CoursesSummaryPanel"
import { CoursesYourEntriesPanel } from "./CoursesYourEntriesPanel"

/**
 * Fetches everything the page needs in one visibility-scoped call and
 * composes it. The header lives here (not directly in `page.tsx`) so its
 * export button can share the same fetched rows as the table - it needs the
 * full course list, not just the toolbar's currently-filtered view.
 */
export async function CoursesList() {
  const { rows, summary, myCourses } = await getCoursesPageData()

  return (
    <>
      <CoursesPageHeader rows={rows} />
      <CoursesListClient rows={rows} />
      <div className="grid w-full gap-4 px-10 pt-6 pb-10 md:grid-cols-2 md:px-12">
        <CoursesSummaryPanel summary={summary} />
        <CoursesYourEntriesPanel myCourses={myCourses} />
      </div>
    </>
  )
}
