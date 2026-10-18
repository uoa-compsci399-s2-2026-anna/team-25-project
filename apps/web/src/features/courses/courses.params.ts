import { notFound } from "next/navigation"
import type { SearchParams } from "nuqs/server"

export type CourseRouteParams = Promise<{ courseId: string }>
export type CourseRouteSearchParams = Promise<SearchParams>

export const parseCourseId = async (params: CourseRouteParams) => {
  const { courseId } = await params
  const id = Number(courseId)
  if (!Number.isInteger(id) || id <= 0) notFound()
  return id
}
