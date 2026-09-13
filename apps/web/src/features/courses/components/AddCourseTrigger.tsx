import { connection } from "next/server"
import { Suspense } from "react"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import { AddCourseDialog, AddCourseTriggerButton } from "./AddCourseDialog"

const loadDefaultRole = async (): Promise<string> => {
  const { collection, user } = await getCurrentUser()
  return collection === Slugs.Collections.MEMBERS ? (user.position ?? "") : ""
}

// The signed-in member's profile is per-viewer, so it's isolated here rather
// than read in CoursesPageHeader directly - that keeps the header's own
// shell viewer-independent and prerenderable, matching how NavAuthStatus and
// "Your Entries" stream in beside an otherwise-static parent.
export async function AddCourseTriggerWithDefaultRole() {
  // Waiting on the request itself (instant once one exists) is what marks
  // this boundary as dynamic during prerendering. The member lookup is then
  // deliberately *not* awaited: the dialog mounts once and the role streams
  // into it as a promise. Awaiting it here instead would hold this boundary
  // on its fallback until the lookup finished and then swap in a fresh
  // dialog, discarding anything typed into the fallback in the meantime.
  await connection()
  return <AddCourseDialog defaultRole={loadDefaultRole()} />
}

export function AddCourseTrigger() {
  return (
    // Only the bare button as the fallback, never a second dialog - there is
    // nothing here for a click to lose when the real one takes its place.
    <Suspense fallback={<AddCourseTriggerButton />}>
      <AddCourseTriggerWithDefaultRole />
    </Suspense>
  )
}
