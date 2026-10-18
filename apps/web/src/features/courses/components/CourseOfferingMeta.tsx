import { CourseOfferingNotice, CourseOfferingPeriodBadge } from "@repo/ui/components/composite"
import { Skeleton } from "@repo/ui/components/ui"
import Link from "next/link"
import { Routes } from "@/lib/routes"
import { formatDate, offeringPeriod } from "../courses.format"
import { offeringTiming } from "../courses.offerings"
import type { CourseRouteParams, CourseRouteSearchParams } from "../courses.params"
import { resolveCourseOffering } from "../courses.queries"
import { CourseOfferingSwitcher } from "./CourseOfferingSwitcher"

// Aliased as the React compiler rule reads a capitalized call inside a component as
// a component rendered the wrong way.
const offeringHref = Routes.COURSES.OFFERING

export const CourseOfferingMeta = async ({
  params,
  searchParams,
}: {
  params: CourseRouteParams
  searchParams: CourseRouteSearchParams
}) => {
  const { courseId, now, offerings, selected, current } = await resolveCourseOffering(
    params,
    searchParams,
  )
  // The header 404s a course with nothing published, so this is only reachable
  // mid-publication. Render nothing rather than taking down the page.
  if (!selected) return null

  const timing = offeringTiming(selected, now)
  const publishedAt = formatDate(selected.publishedAt)
  const updatedAt = formatDate(selected.updatedAt)

  return (
    <div className="flex flex-col gap-3 lg:col-start-1 lg:row-start-1">
      {selected.id !== current.id && (
        <CourseOfferingNotice
          currentHref={offeringHref(courseId)}
          currentPeriod={offeringPeriod(current)}
          linkComponent={Link}
          period={offeringPeriod(selected)}
          timing={timing}
        />
      )}
      <div className="flex flex-wrap items-center gap-3">
        <CourseOfferingPeriodBadge period={offeringPeriod(selected)} timing={timing} />
        {publishedAt && (
          <span className="text-muted-foreground text-xs">Published {publishedAt}</span>
        )}
        {updatedAt && updatedAt !== publishedAt && (
          <span className="text-muted-foreground text-xs">- updated {updatedAt}</span>
        )}
        {offerings.length > 1 && (
          <div className="sm:ml-auto">
            <CourseOfferingSwitcher
              courseId={courseId}
              currentId={current.id}
              options={offerings.map((offering) => ({
                id: offering.id,
                period: offeringPeriod(offering),
                timing: offeringTiming(offering, now),
              }))}
              selectedId={selected.id}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export const CourseOfferingMetaSkeleton = () => (
  <Skeleton className="h-5 w-56 lg:col-start-1 lg:row-start-1" />
)
