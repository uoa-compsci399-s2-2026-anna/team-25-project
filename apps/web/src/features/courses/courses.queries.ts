import { QueryKeys } from "@repo/shared/constants/query-keys"
import type { Course, CourseVersion } from "@repo/shared/payload-types"
import { cacheLife, cacheTag } from "next/cache"
import type { Where } from "payload"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import type { CourseTableRow } from "./components/CoursesTable"
import {
  type CoursesSummaryStats,
  type MyCoursesSummary,
  summarizeCourses,
  summarizeMyCourses,
  toCourseTableRow,
} from "./courses.format"

// The newest offering wins for each course; sorting by `-id` as a tiebreaker
// keeps the pick stable if two offerings ever share a `startDate`.
const NEWEST_FIRST = ["-startDate", "-id"]

const courseIdOf = (version: CourseVersion): number =>
  typeof version.course === "number" ? version.course : version.course.id

export interface CoursesTableData {
  rows: CourseTableRow[]
  summary: CoursesSummaryStats
}

/**
 * The public, published-only view of the directory: it looks the same for
 * every viewer, so it's safe to cache. The trick is not passing a `user`
 * into these queries - without one, `courseRead`/`versionRead` both fall
 * back to their published-only rule for everyone, admins included, which is
 * what keeps the result viewer-independent.
 */
export const getCoursesTableData = async (): Promise<CoursesTableData> => {
  const payload = await getPayloadClient()

  const [{ docs: courses }, { docs: versions }] = await Promise.all([
    payload.find({
      collection: Slugs.Collections.COURSES,
      depth: 1,
      overrideAccess: false,
      pagination: false,
      sort: "code",
    }),
    payload.find({
      collection: Slugs.Collections.COURSE_VERSIONS,
      depth: 1,
      overrideAccess: false,
      pagination: false,
      sort: NEWEST_FIRST,
    }),
  ])

  const latestVersionByCourseId = new Map<number, CourseVersion>()
  for (const version of versions) {
    const courseId = courseIdOf(version)
    if (!latestVersionByCourseId.has(courseId)) {
      latestVersionByCourseId.set(courseId, version)
    }
  }

  const rows = courses.map((course) =>
    toCourseTableRow(course, latestVersionByCourseId.get(course.id)),
  )

  return { rows, summary: summarizeCourses(rows) }
}

export const getCoursesTableDataCached = async () => {
  "use cache"
  cacheLife("max")
  cacheTag(QueryKeys.COURSES.ROOT)
  return getCoursesTableData()
}

/**
 * The courses the signed-in viewer convenes, or `null` if nobody's signed in.
 * Gated to the `members` collection specifically: `getCurrentUser` can also
 * return an admin, and an admin's numeric id can collide with a completely
 * different member's id since they're separate collections - so just
 * checking that a `user` exists isn't enough to know whose courses to look up.
 *
 * This stays dynamic and uncached on purpose, reading the request straight
 * through `getCurrentUser` - kept out of `getCoursesTableDataCached` so a
 * shared cache can never leak one viewer's own-course count to another.
 */
export const getMyCoursesSummary = async (
  rows: CourseTableRow[],
): Promise<MyCoursesSummary | null> => {
  const { collection, user } = await getCurrentUser()
  if (collection !== Slugs.Collections.MEMBERS) return null

  const payload = await getPayloadClient()
  const { docs: myCourses } = await payload.find({
    collection: Slugs.Collections.COURSES,
    where: { owner: { equals: user.id } },
    depth: 0,
    overrideAccess: false,
    pagination: false,
    user,
  })

  const myCourseIds = new Set(myCourses.map((course) => String(course.id)))
  return summarizeMyCourses(myCourseIds, rows)
}

const publishedCourseWhere = (courseId: number): Where => ({
  and: [{ id: { equals: courseId } }, { hasPublishedVersion: { equals: true } }],
})

const publishedOfferingsWhere = (courseId: number): Where => ({
  and: [{ course: { equals: courseId } }, { _status: { equals: "published" } }],
})

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
