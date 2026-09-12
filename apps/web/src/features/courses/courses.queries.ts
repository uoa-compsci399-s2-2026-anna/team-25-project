import { QueryKeys } from "@repo/shared/constants/query-keys"
import type { Course, CourseVersion } from "@repo/shared/payload-types"
import { cacheLife, cacheTag } from "next/cache"
import type { Where } from "payload"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"

const publishedCourseWhere = (courseId: number): Where => ({
  and: [{ id: { equals: courseId } }, { hasPublishedVersion: { equals: true } }],
})

const publishedOfferingsWhere = (courseId: number): Where => ({
  and: [{ course: { equals: courseId } }, { _status: { equals: "published" } }],
})

const NEWEST_FIRST = ["-startDate", "-id"]

export const getPublishedCourse = async (courseId: number): Promise<Course | null> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: Slugs.Collections.COURSES,
    where: publishedCourseWhere(courseId),
    depth: 0,
    limit: 1,
    pagination: false,
  })
  return docs[0] ?? null
}

export const getPublishedCourseCached = async (courseId: number) => {
  "use cache"
  cacheTag(QueryKeys.COURSES.ID(courseId))
  cacheLife("max")

  return getPublishedCourse(courseId)
}

export const getPublishedOfferings = async (courseId: number): Promise<CourseVersion[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: Slugs.Collections.COURSE_VERSIONS,
    where: publishedOfferingsWhere(courseId),
    sort: NEWEST_FIRST,
    // Each offering carries the display names it was published with, so nothing here
    // needs its relationships populated.
    depth: 0,
    pagination: false,
  })
  return docs
}

export const getPublishedOfferingsCached = async (courseId: number) => {
  "use cache"
  cacheTag(QueryKeys.COURSES.ID(courseId))
  cacheLife("max")

  return getPublishedOfferings(courseId)
}

export const getLatestPublishedOffering = async (
  courseId: number,
): Promise<CourseVersion | null> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: Slugs.Collections.COURSE_VERSIONS,
    where: publishedOfferingsWhere(courseId),
    sort: NEWEST_FIRST,
    depth: 0,
    limit: 1,
    pagination: false,
  })
  return docs[0] ?? null
}

export const getLatestPublishedOfferingCached = async (courseId: number) => {
  "use cache"
  cacheTag(QueryKeys.COURSES.ID(courseId))
  cacheLife("max")

  return getLatestPublishedOffering(courseId)
}

/**
 * One offering by ID, scoped to its course.
 *
 * The course ID comes from the URL, so a request for an offering that belongs to
 * another course must miss rather than render under the wrong course.
 */
export const getPublishedOffering = async (
  courseId: number,
  offeringId: number,
): Promise<CourseVersion | null> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: Slugs.Collections.COURSE_VERSIONS,
    where: { and: [{ id: { equals: offeringId } }, publishedOfferingsWhere(courseId)] },
    depth: 0,
    limit: 1,
    pagination: false,
  })
  return docs[0] ?? null
}

export const getPublishedOfferingCached = async (courseId: number, offeringId: number) => {
  "use cache"
  cacheTag(QueryKeys.COURSES.ID(courseId))
  cacheLife("max")

  return getPublishedOffering(courseId, offeringId)
}

/**
 * Gets a specific offering for a course, or the latest if none is specified.
 */
export const getSelectedOffering = async (courseId: number, offeringId?: number) => {
  const selected = offeringId ? await getPublishedOfferingCached(courseId, offeringId) : null
  return selected ?? (await getLatestPublishedOfferingCached(courseId))
}
