import { Card, CardContent, Eyebrow, Skeleton } from "@repo/ui/components/ui"
import type { MyCoursesSummary } from "../courses.format"

export interface CoursesYourEntriesPanelProps {
  /** `null` covers both nobody being signed in and a signed-in admin, who has no courses of their own to summarize. */
  myCourses: MyCoursesSummary | null
}

// Shown while `getMyCoursesSummary` - dynamic and per-viewer - is still streaming in.
export function CoursesYourEntriesPanelSkeleton() {
  return (
    <Card>
      <CardContent className="w-full gap-3">
        <Eyebrow>Your entries</Eyebrow>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  )
}

const upToDateMessage = ({ total, upToDate, year }: MyCoursesSummary): string => {
  if (upToDate === total) {
    if (total === 1) return `It's up to date for ${year}.`
    if (total === 2) return `Both are up to date for ${year}.`
    return `All are up to date for ${year}.`
  }
  return `${upToDate} of ${total} ${upToDate === 1 ? "is" : "are"} up to date for ${year}.`
}

// "Manage your courses" is just text, not a link - there's no
// course-management page yet to send it to.
export function CoursesYourEntriesPanel({ myCourses }: CoursesYourEntriesPanelProps) {
  return (
    <Card>
      <CardContent className="w-full gap-3">
        <Eyebrow>Your entries</Eyebrow>
        {myCourses === null && (
          <p className="text-muted-foreground">Sign in to view your courses</p>
        )}
        {myCourses !== null && myCourses.total === 0 && (
          <p className="text-muted-foreground">You don't convene any courses yet.</p>
        )}
        {myCourses !== null && myCourses.total > 0 && (
          <>
            <p className="text-muted-foreground">
              You convene {myCourses.total} course{myCourses.total === 1 ? "" : "s"}.{" "}
              {upToDateMessage(myCourses)}
            </p>
            <p className="text-muted-foreground">Manage your courses →</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
