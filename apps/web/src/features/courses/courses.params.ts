import { notFound } from "next/navigation"
import { createLoader, type SearchParams } from "nuqs/server"
import { parseAsPositiveInteger } from "@/lib/search-params"

export type CourseRouteParams = Promise<{ courseId: string }>
export type CourseRouteSearchParams = Promise<SearchParams>

export const parseCourseId = async (params: CourseRouteParams) => {
  const { courseId } = await params
  const id = Number(courseId)
  if (!Number.isInteger(id) || id <= 0) notFound()
  return id
}

// `offering` picks one of the course's offerings; without it the page shows the current one.
const loadCourseSearchParams = createLoader({ offering: parseAsPositiveInteger })

export const parseOfferingId = async (searchParams: CourseRouteSearchParams) =>
  (await loadCourseSearchParams(searchParams)).offering ?? undefined
