import { ResourceCard, ResourceCardSkeleton } from "@repo/ui/components/composite"
import { Separator, Skeleton } from "@repo/ui/components/ui"
import { FolderOpen } from "lucide-react"
import type { Route } from "next"
import Link from "next/link"
import { EmptyState } from "@/components/EmptyState"
import { StringHrefLink } from "@/components/StringHrefLink"
import { CourseOfferingSection } from "@/features/courses/components/CourseOffering/CourseOfferingPrimitives"
import { type CourseRouteParams, parseCourseId } from "@/features/courses/courses.params"
import { Routes } from "@/lib/routes"
import { resourceOwnerId, toResourceCardProps } from "../resource-card-props"
import { getCourseResourcesCached } from "../resources.queries"
import { serializeResourceSearchParams } from "../resources.search-params"
import { ResourceCardActionsServer } from "./ResourceCardActionsServer"

/** Enough to show what's there; the rest are one click away on the filtered resources list. */
export const COURSE_RESOURCES_SHOWN = 5

// Fourth row of the course page's grid, below the offering, where the sidebar also reaches.
const placement = "mt-4 flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-4"

export const CourseResources = async ({ params }: { params: CourseRouteParams }) => {
  const courseId = await parseCourseId(params)
  const { resources, total } = await getCourseResourcesCached(courseId, COURSE_RESOURCES_SHOWN)

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
            {resources.map((resource) => (
              <ResourceCard
                action={
                  <ResourceCardActionsServer
                    ownerId={resourceOwnerId(resource)}
                    resourceId={resource.id}
                    title={resource.title}
                  />
                }
                key={resource.id}
                linkComponent={StringHrefLink}
                size="sm"
                {...toResourceCardProps(resource)}
              />
            ))}
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
