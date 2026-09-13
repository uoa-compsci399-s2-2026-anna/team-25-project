import { Card, CardContent, Eyebrow } from "@repo/ui/components/ui"
import type { MyCoursesSummary } from "../courses.format"

export interface CoursesYourEntriesPanelProps {
  /** `null` when the viewer isn't signed in - there's nothing of theirs to summarize. */
  myCourses: MyCoursesSummary | null
}

const upToDateMessage = ({ total, upToDate, year }: MyCoursesSummary): string => {
  if (upToDate === total) {
    if (total === 1) return `It's up to date for ${year}.`
    if (total === 2) return `Both are up to date for ${year}.`
    return `All are up to date for ${year}.`
  }
  return `${upToDate} of ${total} ${upToDate === 1 ? "is" : "are"} up to date for ${year}.`
}

/**
 * "Manage your courses" is plain text, not a link - there's no dedicated
 * course-management page yet for it to point at.
 */
export function CoursesYourEntriesPanel({ myCourses }: CoursesYourEntriesPanelProps) {
  return (
    <Card>
      <CardContent className="w-full gap-3">
        <Eyebrow>Your entries</Eyebrow>
        {myCourses === null && (
          <p className="text-muted-foreground">Sign in to see the courses you convene.</p>
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
