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

// Newest offering per course wins the tiebreak; `-id` keeps the pick stable
// when two offerings somehow share a `startDate`.
const NEWEST_FIRST = ["-startDate", "-id"]

const courseIdOf = (version: CourseVersion): number =>
  typeof version.course === "number" ? version.course : version.course.id

export interface CoursesPageData {
  rows: CourseTableRow[]
  summary: CoursesSummaryStats
  /** `null` when nobody's signed in - there's no "my courses" to summarize. */
  myCourses: MyCoursesSummary | null
}

/**
 * Everything the `/courses` page needs in one visibility-scoped fetch: a row
 * per visible course (enriched with its most recent visible offering),
 * directory-wide summary stats, and - if signed in - how many courses the
 * viewer convenes.
 *
 * `overrideAccess: false` + the current viewer makes this respect the same
 * `courseRead`/`versionRead` rules the REST/GraphQL APIs enforce - the Local
 * API skips access control by default, which would otherwise show every
 * convenor's unpublished courses and draft offerings to any visitor. Left
 * uncached: the result is viewer-specific (an owner/editor sees their own
 * drafts too), and `getCurrentUser` reads the request, which a `"use cache"`
 * function can't do anyway.
 */
export const getCoursesPageData = async (): Promise<CoursesPageData> => {
  const payload = await getPayloadClient()
  const { user } = await getCurrentUser()

  const [{ docs: courses }, { docs: versions }] = await Promise.all([
    payload.find({
      collection: Slugs.Collections.COURSES,
      depth: 1,
      overrideAccess: false,
      pagination: false,
      sort: "code",
      user: user ?? undefined,
    }),
    payload.find({
      collection: Slugs.Collections.COURSE_VERSIONS,
      depth: 1,
      overrideAccess: false,
      pagination: false,
      sort: NEWEST_FIRST,
      user: user ?? undefined,
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

  return {
    rows,
    summary: summarizeCourses(rows),
    myCourses: user ? summarizeMyCourses(courses, rows, user.id) : null,
  }
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
