import type { Course, Resource } from "@repo/shared/payload-types"
import type { SavedAttachment } from "@repo/ui/components/composite"
import { cache } from "react"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import {
  getAllCourseOptions,
  getEditableCourseOptions,
  getResourceByIdCached,
  type ResourceCourseOption,
  toCourseOption,
} from "../resources.queries"
import { ResourceCardActions } from "./ResourceCardActions"

// A list shows many cards, so each request looks the viewer's courses up once, not per card.
// Admins can link any course; members only the ones they own or edit, as `courseWrite` allows.
const courseOptionsFor = cache(
  (memberId: number | null): Promise<ResourceCourseOption[]> =>
    memberId === null ? getAllCourseOptions() : getEditableCourseOptions(memberId),
)

/**
 * The picker's options, with the resource's own course first when it isn't among them - a
 * member who no longer edits it can still keep the link (see validateResourceCourse), and
 * the Select would otherwise show it as "No course".
 */
const withCurrentCourse = (options: ResourceCourseOption[], course: Course | undefined) =>
  !course || options.some((option) => option.value === course.id)
    ? options
    : [toCourseOption(course), ...options]

const savedAttachments = (resource: Resource): SavedAttachment[] =>
  (resource.attachments ?? []).flatMap((attachment) =>
    typeof attachment === "object"
      ? [
          {
            id: attachment.id,
            name: attachment.filename ?? "Attachment",
            size: attachment.filesize ?? undefined,
          },
        ]
      : [],
  )

type ResourceCardActionsServerProps = {
  resourceId: number
  /** Who owns it, from the card's own data, so viewers who can't manage it cost no lookup. */
  ownerId: number | undefined
  title: string
}

// getCurrentUser() reads headers(), which is dynamic - every list that renders this sits
// inside a Suspense boundary already, so there is nothing extra to isolate here.
export const ResourceCardActionsServer = async ({
  resourceId,
  ownerId,
  title,
}: ResourceCardActionsServerProps) => {
  const { collection, user } = await getCurrentUser()
  const isAdmin = collection === Slugs.Collections.ADMIN
  const canManage = isAdmin || (user !== null && ownerId === user.id)
  if (!canManage) return null

  // The cards load only what they draw, so the form's values come from the full resource.
  const [resource, options] = await Promise.all([
    getResourceByIdCached(resourceId),
    courseOptionsFor(isAdmin ? null : user.id),
  ])
  if (!resource) return null

  const course = typeof resource.course === "object" ? (resource.course ?? undefined) : undefined

  return (
    <ResourceCardActions
      courses={withCurrentCourse(options, course)}
      initialValues={{
        course: course?.id ?? null,
        description: resource.description,
        title: resource.title,
      }}
      resourceId={resource.id}
      savedAttachments={savedAttachments(resource)}
      title={title}
    />
  )
}
