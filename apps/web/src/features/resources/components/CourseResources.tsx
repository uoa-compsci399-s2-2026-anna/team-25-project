import { ResourceCard, ResourceCardSkeleton } from "@repo/ui/components/composite"
import { Separator, Skeleton } from "@repo/ui/components/ui"
import { FolderOpen } from "lucide-react"
import type { Route } from "next"
import Link from "next/link"
import { withEditHash } from "@/components/Editor/editOnLoad"
import { EmptyState } from "@/components/EmptyState"
import { StringHrefLink } from "@/components/StringHrefLink"
import { CourseOfferingSection } from "@/features/courses/components/CourseOffering/CourseOfferingPrimitives"
import { type CourseRouteParams, parseCourseId } from "@/features/courses/courses.params"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import { Routes } from "@/lib/routes"
import { toResourceCardProps } from "../resource-card-props"
import { getCourseResourcesCached } from "../resources.queries"
import { serializeResourceSearchParams } from "../resources.search-params"
import { ResourceCardActions } from "./ResourceCardActions"

/** Enough to show what's there; the rest are one click away on the filtered resources list. */
export const COURSE_RESOURCES_SHOWN = 5

// Fourth row of the course page's grid, below the offering, where the sidebar also reaches.
const placement = "mt-4 flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-4"

export const CourseResources = async ({ params }: { params: CourseRouteParams }) => {
  const courseId = await parseCourseId(params)
  // The section already sits behind its own Suspense boundary, so reading the viewer is fine here.
  const [{ resources, total }, { collection, user }] = await Promise.all([
    getCourseResourcesCached(courseId, COURSE_RESOURCES_SHOWN),
    getCurrentUser(),
  ])

  return (
    <div className={placement}>
      <Separator />
      <CourseOfferingSection title={`Resources - ${total}`}>
        {resources.length === 0 ? (
          <EmptyState
            description="No resources are linked to this course yet."
            icon={<FolderOpen />}
            title="No resources yet"
            variant="section"
          />
        ) : (
          <div className="flex flex-col gap-4">
            {resources.map((resource) => {
              const card = toResourceCardProps(resource)
              const ownerId =
                typeof resource.owner === "object" ? resource.owner.id : resource.owner
              // Only the owner - admins manage resources from the admin dashboard.
              const canManage = collection === Slugs.Collections.MEMBERS && user.id === ownerId

              return (
                <ResourceCard
                  action={
                    canManage && (
                      <ResourceCardActions
                        editHref={withEditHash(card.href)}
                        resourceId={resource.id}
                        title={resource.title}
                      />
                    )
                  }
                  key={resource.id}
                  linkComponent={StringHrefLink}
                  size="sm"
                  {...card}
                />
              )
            })}
            {total > resources.length && (
              <Link
                className="self-start text-sm underline underline-offset-2"
                href={
                  serializeResourceSearchParams(Routes.RESOURCES.ROOT, {
                    course: courseId,
                  }) as Route
                }
              >
                View all {total} resources
              </Link>
            )}
          </div>
        )}
      </CourseOfferingSection>
    </div>
  )
}

export const CourseResourcesSkeleton = () => (
  <div className={placement}>
    <Separator />
    <Skeleton className="h-4 w-32" />
    <ResourceCardSkeleton size="sm" />
    <ResourceCardSkeleton size="sm" />
  </div>
)
