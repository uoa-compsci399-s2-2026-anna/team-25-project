import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import {
  getToday,
  isCourseEditor,
  ownerIdOf,
  selectOffering,
  toNewOfferingValues,
  toOfferingValues,
} from "../courses.format"
import { type CourseRouteSearchParams, parseOfferingId } from "../courses.params"
import { getPublishedCourseCached, getPublishedOfferingsCached } from "../courses.queries"
import { DeleteOfferingButton } from "./DeleteCourseButtons"
import { AddOfferingDialog, EditOfferingDialog } from "./OfferingDialogs"

/**
 * "Add offering" and "Edit offering" for the course's owner and editors. A new
 * offering is filled in from the current one; Edit corrects the one being viewed.
 * The owner can also delete the one being viewed, while the course has another.
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

  const offerings = await getPublishedOfferingsCached(courseId)
  const { offering, primary } = selectOffering(
    offerings,
    await parseOfferingId(searchParams),
    getToday(),
  )
  if (!offering || !primary) return null

  // The hooks refuse the last published offering, as that would leave the course empty.
  const canDelete = ownerIdOf(course) === user.id && offerings.length > 1

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
      {canDelete && (
        <DeleteOfferingButton
          courseId={courseId}
          offeringId={offering.id}
          period={offering.period?.trim() || "this offering"}
        />
      )}
    </div>
  )
}
