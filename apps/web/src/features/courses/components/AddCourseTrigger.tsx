import { AnimatedSuspense, Skeleton } from "@repo/ui/components/ui"
import { connection } from "next/server"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import { AddCourseDialog } from "./AddCourseDialog"

// Only members can add a course, so the button waits on the viewer rather than
// prerendering. Isolated here so the header's own
// shell stays viewer-independent, matching how NavAuthStatus streams in.
export async function AddCourseTriggerForMember() {
  // Marks this boundary as dynamic during prerendering.
  await connection()
  const { collection, user } = await getCurrentUser()
  if (collection !== Slugs.Collections.MEMBERS) return null
  return <AddCourseDialog defaultRole={user.position ?? ""} />
}

export function AddCourseTrigger() {
  return (
    <AnimatedSuspense fallback={<Skeleton className="h-9 w-36 rounded-full" />}>
      <AddCourseTriggerForMember />
    </AnimatedSuspense>
  )
}
