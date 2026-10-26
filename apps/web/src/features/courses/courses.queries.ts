import { QueryKeys } from "@repo/shared/constants/query-keys"
import type { Course, CourseVersion } from "@repo/shared/payload-types"
import { cacheLife, cacheTag } from "next/cache"
import type { Where } from "payload"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import type { CourseTableRow } from "./components/CoursesTable"
import {
  findCurrentOffering,
  getToday,
  groupByCourseId,
  type MyCoursesSummary,
  type MyDraftCourses,
  summarizeMyCourses,
  toCourseTableRow,
  toEditableDraftCourse,
} from "./courses.format"

// The newest offering wins for each course; sorting by `-id` as a tiebreaker
// keeps the pick stable if two offerings ever share a `startDate`.
const NEWEST_FIRST = ["-startDate", "-id"]

/**
 * The public, published-only view of the directory: it looks the same for
 * every viewer, so it's safe to cache. The trick is not passing a `user`
 * into these queries - without one, `courseRead`/`versionRead` both fall
 * back to their published-only rule for everyone, admins included, which is
 * what keeps the result viewer-independent.
 */
export const getCoursesTableData = async (today = getToday()): Promise<CourseTableRow[]> => {
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

  const offerings = groupByCourseId(versions)
  return courses.map((course) => {
    const courseOfferings = offerings.get(course.id) ?? []
    const { primary } = findCurrentOffering(courseOfferings, today)
    return toCourseTableRow(course, primary, courseOfferings.length)
  })
}

const NO_DRAFTS: MyDraftCourses = { editable: {}, rows: [] }

/**
 * The signed-in member's own courses that have never been published, as table rows
 * plus what the add-course dialog needs to reopen each one. The public table can't
 * show these - `courseRead` hides a course until it has a published offering - so
 * without them a saved draft would vanish from the page.
 *
 * Unlike `getCoursesTableData` this reads the viewer and passes them as `user`, so
 * Payload's access rules limit it to courses the member owns or edits. That makes it
 * viewer-specific: keep it uncached, and out of `getCoursesTableDataCached`, so one
 * member's drafts can never be served to another. Admins and signed-out viewers get
 * none; the same `members` gate as `getMyCoursesSummary` applies, for the same reason.
 *
 * Offerings are read with `draft: true`: saving a draft over an existing offering
 * only writes a new revision, leaving the collection row as it was first created.
 */
export const getMyDraftCourses = async (): Promise<MyDraftCourses> => {
  const { collection, user } = await getCurrentUser()
  if (collection !== Slugs.Collections.MEMBERS) return NO_DRAFTS

  const payload = await getPayloadClient()
  const { docs: courses } = await payload.find({
    collection: Slugs.Collections.COURSES,
    where: {
      and: [
        { hasPublishedVersion: { not_equals: true } },
        { or: [{ owner: { equals: user.id } }, { editors: { contains: user.id } }] },
      ],
    },
    depth: 1,
    overrideAccess: false,
    pagination: false,
    sort: "code",
    user,
  })
  if (courses.length === 0) return NO_DRAFTS

  const { docs: versions } = await payload.find({
    collection: Slugs.Collections.COURSE_VERSIONS,
    where: { course: { in: courses.map((course) => course.id) } },
    depth: 1,
    draft: true,
    overrideAccess: false,
    pagination: false,
    sort: NEWEST_FIRST,
    user,
  })

  // createCourse writes a course and its first offering together, so a course
  // with no offering shouldn't exist - but if one did, it would have nothing to
  // reopen and no course page to link to, so it's left out rather than listed
  // as a dead end.
  const offerings = groupByCourseId(versions)
  const viewer = { id: user.id, role: user.position ?? "" }
  const drafts: MyDraftCourses = { editable: {}, rows: [] }
  for (const course of courses) {
    const courseOfferings = offerings.get(course.id)
    if (!courseOfferings) continue
    const { primary } = findCurrentOffering(courseOfferings, getToday())
    drafts.rows.push(toCourseTableRow(course, primary, courseOfferings.length))
    // The dialog reopens the newest draft, whichever offering the row shows.
    drafts.editable[String(course.id)] = toEditableDraftCourse(course, courseOfferings[0], viewer)
  }
  return drafts
}

// "hours" rather than "max": which offering is current changes with the date, not
// only when an offering is saved, so the cached rows can't outlive the day.
export const getCoursesTableDataCached = async () => {
  "use cache"
  cacheLife("hours")
  cacheTag(QueryKeys.COURSES.ROOT)
  return getCoursesTableData()
}

/**
 * The signed-in viewer's own courses, the ones they edit, and the offerings they
 * taught, or `null` if nobody's signed in. Gated to the `members` collection
 * specifically: `getCurrentUser` can also return an admin, and an admin's numeric
 * id can collide with a completely different member's id since they're separate
 * collections - so just checking that a `user` exists isn't enough to know whose
 * courses to look up.
 *
 * This stays dynamic and uncached on purpose, reading the request straight
 * through `getCurrentUser` - kept out of `getCoursesTableDataCached` so a
 * shared cache can never leak one viewer's courses to another.
 */
export const getMyCoursesSummary = async (
  rows: CourseTableRow[],
): Promise<MyCoursesSummary | null> => {
  const { collection, user } = await getCurrentUser()
  if (collection !== Slugs.Collections.MEMBERS) return null

  const payload = await getPayloadClient()
  const publishedOfferings = (where: Where) =>
    payload.find({
      collection: Slugs.Collections.COURSE_VERSIONS,
      where: { and: [where, { _status: { equals: "published" } }] },
      depth: 0,
      overrideAccess: false,
      pagination: false,
      select: { course: true, period: true, startDate: true },
      sort: NEWEST_FIRST,
      user,
    })
  const [{ docs: courses }, { docs: taughtOfferings }, { docs: ownedOfferings }] =
    await Promise.all([
      payload.find({
        collection: Slugs.Collections.COURSES,
        where: { or: [{ owner: { equals: user.id } }, { editors: { contains: user.id } }] },
        depth: 0,
        overrideAccess: false,
        pagination: false,
        select: { owner: true },
        user,
      }),
      publishedOfferings({ "teachingTeam.member": { equals: user.id } }),
      publishedOfferings({ "course.owner": { equals: user.id } }),
    ])

  return summarizeMyCourses({ memberId: user.id, courses, rows, taughtOfferings, ownedOfferings })
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

/**
 * The course's never-published draft offerings, newest first. Payload only lets the
 * course's owner and editors read drafts, so this is per-viewer and uncached.
 */
export const getMyDraftOfferings = async (courseId: number): Promise<CourseVersion[]> => {
  const { collection, user } = await getCurrentUser()
  if (collection !== Slugs.Collections.MEMBERS) return []

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: Slugs.Collections.COURSE_VERSIONS,
    where: { course: { equals: courseId } },
    depth: 0,
    draft: true,
    overrideAccess: false,
    pagination: false,
    sort: NEWEST_FIRST,
    user,
  })
  return docs.filter((version) => version._status === "draft" && !version.publishedAt)
}
