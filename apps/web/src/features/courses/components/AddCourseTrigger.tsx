import { Suspense } from "react"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import { AddCourseDialog } from "./AddCourseDialog"

// The signed-in member's profile is per-viewer, so it's isolated here rather
// than read in CoursesPageHeader directly - that keeps the header's own
// shell viewer-independent and prerenderable, matching how NavAuthStatus and
// "Your Entries" stream in beside an otherwise-static parent.
export async function AddCourseTriggerWithDefaultRole() {
  const { collection, user } = await getCurrentUser()
  const defaultRole = collection === Slugs.Collections.MEMBERS ? (user.position ?? "") : ""
  return <AddCourseDialog defaultRole={defaultRole} />
}

export function AddCourseTrigger() {
  return (
    <Suspense fallback={<AddCourseDialog defaultRole="" />}>
      <AddCourseTriggerWithDefaultRole />
    </Suspense>
  )
}
