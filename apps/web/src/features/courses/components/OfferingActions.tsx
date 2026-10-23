import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import {
  getToday,
  isCourseEditor,
  selectOffering,
  toNewOfferingValues,
  toOfferingValues,
} from "../courses.format"
import { type CourseRouteSearchParams, parseOfferingId } from "../courses.params"
import { getPublishedCourseCached, getPublishedOfferingsCached } from "../courses.queries"
import { AddOfferingDialog, EditOfferingDialog } from "./AddOfferingDialog"

/**
 * "Add offering" and "Edit offering" for the course's owner and editors. A new
 * offering is filled in from the current one; Edit corrects the one being viewed.
 * Per-viewer, so the course page renders this in its own Suspense boundary.
 */
export async function OfferingActions({
  courseId,
  searchParams,
}: {
  courseId: number
  searchParams: CourseRouteSearchParams
}) {
  const { collection, user } = await getCurrentUser()
  if (collection !== Slugs.Collections.MEMBERS) return null

  const course = await getPublishedCourseCached(courseId)
  if (!course || !isCourseEditor(course, user.id)) return null

  const { offering, primary } = selectOffering(
    await getPublishedOfferingsCached(courseId),
    await parseOfferingId(searchParams),
    getToday(),
  )
  if (!offering || !primary) return null

  return (
    <div className="flex gap-2">
      <EditOfferingDialog
        courseId={courseId}
        initialValues={toOfferingValues(offering)}
        // A fresh dialog per offering, so switching offerings never keeps the last one's edits.
        key={offering.id}
        offeringId={offering.id}
      />
      <AddOfferingDialog
        courseId={courseId}
        initialValues={toNewOfferingValues(primary)}
        sourceId={primary.id}
      />
    </div>
  )
}
