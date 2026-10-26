import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import { DeleteCourseButton } from "./DeleteCourseButtons"

/**
 * "Delete course" for admins only - the same rule deleteCourse enforces. Per-viewer,
 * so the course page renders this in its own Suspense boundary.
 */
export async function DeleteCourseAction({ courseId, code }: { courseId: number; code: string }) {
  const { collection } = await getCurrentUser()
  if (collection !== Slugs.Collections.ADMIN) return null

  return <DeleteCourseButton code={code} courseId={courseId} />
}
