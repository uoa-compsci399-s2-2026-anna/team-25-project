import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import {
  findCurrentOffering,
  getToday,
  isCourseEditor,
  toNewOfferingValues,
} from "../courses.format"
import { getPublishedCourseCached, getPublishedOfferingsCached } from "../courses.queries"
import { AddOfferingDialog } from "./AddOfferingDialog"

/**
 * "Add offering" for the course's owner and editors, filled in from its current
 * offering. Per-viewer, so the course page renders it in its own Suspense boundary.
 */
export async function AddOfferingTrigger({ courseId }: { courseId: number }) {
  const { collection, user } = await getCurrentUser()
  if (collection !== Slugs.Collections.MEMBERS) return null

  const course = await getPublishedCourseCached(courseId)
  if (!course || !isCourseEditor(course, user.id)) return null

  const { primary } = findCurrentOffering(await getPublishedOfferingsCached(courseId), getToday())
  if (!primary) return null

  return (
    <AddOfferingDialog
      courseId={courseId}
      initialValues={toNewOfferingValues(primary)}
      sourceId={primary.id}
    />
  )
}
