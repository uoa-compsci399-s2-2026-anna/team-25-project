import { notFound } from "next/navigation"

export type CourseRouteParams = Promise<{ courseId: string }>

export const parseCourseId = async (params: CourseRouteParams) => {
  const { courseId } = await params
  const id = Number(courseId)
  if (!Number.isInteger(id) || id <= 0) notFound()
  return id
}
