import { Badge, Skeleton } from "@repo/ui/components/ui"
import { Info } from "lucide-react"
import Link from "next/link"
import { Routes } from "@/lib/routes"
import {
  formatDate,
  getToday,
  type OfferingTiming,
  offeringTiming,
  selectOffering,
} from "../courses.format"
import {
  type CourseRouteParams,
  type CourseRouteSearchParams,
  parseCourseId,
  parseOfferingId,
} from "../courses.params"
import { getPublishedOfferingsCached } from "../courses.queries"

// Aliased as the React compiler rule reads a capitalized call inside a component as
// a component rendered the wrong way.
const courseHref = Routes.COURSES.COURSE

const viewingMessages: Record<OfferingTiming, (startDate: string | null) => string> = {
  past: () => "You're viewing a past offering.",
  current: () => "You're viewing the current offering.",
  running: () => "You're viewing an offering that's still running.",
  next: (startDate) => `You're viewing the next offering, starting ${startDate}.`,
  future: (startDate) => `You're viewing a future offering, starting ${startDate}.`,
}

export const CourseOfferingMeta = async ({
  params,
  searchParams,
}: {
  params: CourseRouteParams
  searchParams: CourseRouteSearchParams
}) => {
  const courseId = await parseCourseId(params)
  const offeringId = await parseOfferingId(searchParams)
  const offerings = await getPublishedOfferingsCached(courseId)
  // Read after the search params, so the date is the request's and not frozen into a prerender.
  const today = getToday()
  const { offering, primary, ...found } = selectOffering(offerings, offeringId, today)
  // The header 404s a course with nothing published, so this is only reachable
  // mid-publication. Render nothing rather than taking down the page.
  if (!offering) return null

  const publishedAt = formatDate(offering.publishedAt)
  const updatedAt = formatDate(offering.updatedAt)

  return (
    <div className="flex flex-col gap-4 lg:col-start-1 lg:row-start-1">
      {primary && primary.id !== offering.id && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md bg-brand-slate/10 px-3 py-2 text-brand-slate text-sm">
          <Info aria-hidden="true" className="size-4 shrink-0" />
          <span>
            {viewingMessages[offeringTiming(offering, found, today)](
              formatDate(offering.startDate),
            )}
          </span>
          <Link className="font-medium underline underline-offset-4" href={courseHref(courseId)}>
            View {primary.period}
          </Link>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Badge className="uppercase tracking-wide" variant="active">
          {offering.period}
        </Badge>
        {publishedAt && (
          <span className="text-muted-foreground text-xs">Published {publishedAt}</span>
        )}
        {updatedAt && updatedAt !== publishedAt && (
          <span className="text-muted-foreground text-xs">- updated {updatedAt}</span>
        )}
      </div>
    </div>
  )
}

export const CourseOfferingMetaSkeleton = () => (
  <Skeleton className="h-5 w-56 lg:col-start-1 lg:row-start-1" />
)
