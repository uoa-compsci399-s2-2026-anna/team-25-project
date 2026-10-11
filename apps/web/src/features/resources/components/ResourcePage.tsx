import { resourceAttachmentTypeLabel } from "@repo/shared/constants/resource-attachments"
import type { ResourceAttachment } from "@repo/shared/payload-types"
import { AttachmentList } from "@repo/ui/components/composite"
import { Badge, Heading, Skeleton } from "@repo/ui/components/ui"
import Link from "next/link"
import { notFound } from "next/navigation"
import { RichTextContent } from "@/components/RichTextContent"
import {
  CourseOfferingDetail,
  CourseOfferingSection,
  CourseOfferingSidebarCard,
} from "@/features/courses/components/CourseOffering/CourseOfferingPrimitives"
import { AuthorByline } from "@/features/proposals/components/AuthorByline/AuthorByline"
import { Routes } from "@/lib/routes"
import { parseResourceId, type ResourceRouteParams } from "../resources.params"
import { getResourceByIdCached } from "../resources.queries"

// Aliased as the React compiler rule reads a capitalized call inside a component as
// a component rendered the wrong way.
const memberHref = Routes.MEMBERS.MEMBER
const courseHref = Routes.COURSES.COURSE

// Pinned like the proposal page's, so the server and browser format the same day.
const dateFormatter = new Intl.DateTimeFormat("en-NZ", {
  day: "numeric",
  month: "short",
  timeZone: "Pacific/Auckland",
  year: "numeric",
})

// A file with no url has nothing to download, so it is left off the list.
const toAttachmentItems = (attachments: (number | ResourceAttachment)[] | null | undefined) =>
  (attachments ?? []).flatMap((attachment) =>
    typeof attachment === "object" && attachment.url
      ? [
          {
            href: attachment.url,
            id: attachment.id,
            name: attachment.filename ?? "Attachment",
            size: attachment.filesize ?? undefined,
            type: resourceAttachmentTypeLabel(attachment.mimeType),
          },
        ]
      : [],
  )

export const ResourcePage = async ({ params }: { params: ResourceRouteParams }) => {
  const id = await parseResourceId(params)

  const resource = await getResourceByIdCached(id)
  if (!resource) notFound()

  const owner = typeof resource.owner === "object" ? resource.owner : undefined
  const course = typeof resource.course === "object" ? resource.course : undefined
  const institution =
    course && typeof course.institution === "object" ? course.institution : undefined
  const attachments = toAttachmentItems(resource.attachments)

  const shared = dateFormatter.format(new Date(resource.createdAt))
  const updated = dateFormatter.format(new Date(resource.updatedAt))

  return (
    <>
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
          {course && <Badge variant="blue">{course.code}</Badge>}
          <span>Shared {shared}</span>
          {updated !== shared && (
            <>
              <span aria-hidden>-</span>
              <span>updated {updated}</span>
            </>
          )}
        </div>
        <Heading level="h1">{resource.title}</Heading>
        {owner && (
          <Link className="self-start hover:underline" href={memberHref(owner.id)}>
            <AuthorByline authors={[owner]} />
          </Link>
        )}
        <RichTextContent data={resource.description} />
        <CourseOfferingSection title={`Attachments - ${attachments.length}`}>
          {attachments.length > 0 ? (
            <AttachmentList attachments={attachments} />
          ) : (
            <p className="text-muted-foreground text-sm">No files have been attached.</p>
          )}
        </CourseOfferingSection>
      </div>

      <aside className="flex flex-col gap-4">
        <CourseOfferingSidebarCard title="Details">
          <CourseOfferingDetail
            label="Course"
            value={
              course ? (
                // A course with nothing published 404s, so only those with an offering link.
                course.hasPublishedVersion ? (
                  <Link
                    className="underline underline-offset-4"
                    href={courseHref(String(course.id))}
                  >
                    {course.code}
                  </Link>
                ) : (
                  course.code
                )
              ) : (
                "Not linked to a course"
              )
            }
          />
          {institution && <CourseOfferingDetail label="University" value={institution.name} />}
          <CourseOfferingDetail label="Shared" value={shared} />
          <CourseOfferingDetail label="Last updated" value={updated} />
        </CourseOfferingSidebarCard>
      </aside>
    </>
  )
}

export const ResourcePageSkeleton = () => (
  <>
    <div className="flex flex-col gap-6">
      <Skeleton className="h-5 w-48 rounded-full" />
      <Skeleton className="h-10 w-3/4 rounded-md" />
      <Skeleton className="h-10 w-56 rounded-md" />
      <Skeleton className="h-40 w-full rounded-md" />
      <Skeleton className="h-32 w-full rounded-lg" />
    </div>

    <div className="flex flex-col gap-6">
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  </>
)
