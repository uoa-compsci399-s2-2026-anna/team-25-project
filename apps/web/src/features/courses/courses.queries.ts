import { QueryKeys } from "@repo/shared/constants/query-keys"
import type { Course, CourseVersion } from "@repo/shared/payload-types"
import { cacheLife, cacheTag } from "next/cache"
import { connection } from "next/server"
import { Forbidden, NotFound, type PayloadRequest, type Where } from "payload"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import { canEditCourse } from "@/payload/access/Courses/Courses"
import type { CourseTableRow } from "./components/CoursesTable"
import {
  type CoursesSummaryStats,
  type ManageableOffering,
  type ManageableOfferings,
  type MyCoursesSummary,
  type MyDraftCourses,
  summarizeCourses,
  summarizeMyCourses,
  toCourseTableRow,
  toEditableDraftCourse,
  toManageableOffering,
} from "./courses.format"
import { currentOffering, selectOffering } from "./courses.offerings"
import {
  type CourseRouteParams,
  type CourseRouteSearchParams,
  parseCourseId,
} from "./courses.params"
import { loadCourseSearchParams } from "./courses.search-params"

// The newest offering wins for each course; sorting by `-id` as a tiebreaker
// keeps the pick stable if two offerings ever share a `startDate`.
const NEWEST_FIRST = ["-startDate", "-id"]

const courseIdOf = (version: CourseVersion): number =>
  typeof version.course === "number" ? version.course : version.course.id

// Keeps the newest-first order, so each list starts with the course's newest offering.
const versionsByCourseId = (versions: CourseVersion[]) => {
  const grouped = new Map<number, CourseVersion[]>()
  for (const version of versions) {
    const courseId = courseIdOf(version)
    const group = grouped.get(courseId)
    if (group) group.push(version)
    else grouped.set(courseId, [version])
  }
  return grouped
}

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
export const getCoursesTableData = async (now = new Date()): Promise<CoursesTableData> => {
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

  // Each row shows the course's current offering, as its page does by default,
  // and every offering rides along so the semester/year filters can match any of them.
  const offerings = versionsByCourseId(versions)
  const rows = courses.map((course) => {
    const courseOfferings = offerings.get(course.id) ?? []
    return toCourseTableRow(course, currentOffering(courseOfferings, now), courseOfferings)
  })

  return { rows, summary: summarizeCourses(rows) }
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
  //
  // The newest offering, not the current one: these courses were never published,
  // so a draft may have no dates to judge "current" by, and the newest is the one
  // the dialog reopens.
  const versionsByCourse = versionsByCourseId(versions)
  const viewer = { id: user.id, role: user.position ?? "" }
  const drafts: MyDraftCourses = { editable: {}, rows: [] }
  for (const course of courses) {
    const version = versionsByCourse.get(course.id)?.[0]
    if (!version) continue
    drafts.rows.push(toCourseTableRow(course, version))
    drafts.editable[String(course.id)] = toEditableDraftCourse(course, version, viewer)
  }
  return drafts
}

// "hours", not "max": which offering is current moves with the date, so a cached
// table rolls over to a new semester within hours of it starting, with no write
// to revalidate it.
export const getCoursesTableDataCached = async () => {
  "use cache"
  cacheLife("hours")
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

/**
 * The course in the URL, its published offerings, and the one `?offering=` picks,
 * with the `now` that pick was judged against - so everything the page derives
 * from the date (badges, labels, the notice) agrees with it.
 *
 * The offerings are cached; picking the current one isn't, since it depends on
 * today's date - `connection()` defers it to request time. Callers sit inside a
 * Suspense boundary, as anything reading `searchParams` already has to.
 */
export const resolveCourseOffering = async (
  params: CourseRouteParams,
  searchParams: CourseRouteSearchParams,
) => {
  const [courseId, { offering }] = await Promise.all([
    parseCourseId(params),
    loadCourseSearchParams(searchParams),
  ])
  const offerings = await getPublishedOfferingsCached(courseId)
  await connection()
  const now = new Date()
  return { courseId, now, ...selectOffering(offerings, offering, now) }
}

// Unscheduled drafts sort first: they're the ones still being written.
const byStartNewestFirst = (a: ManageableOfferingSource, b: ManageableOfferingSource) => {
  const start = (version: CourseVersion) =>
    version.startDate ? Date.parse(version.startDate) : Number.POSITIVE_INFINITY
  return start(b.version) - start(a.version) || b.version.id - a.version.id
}

type ManageableOfferingSource = { version: CourseVersion; status: ManageableOffering["status"] }

/**
 * Every offering of a course, drafts included, for Manage offerings - or `null`
 * unless the viewer is a member who owns or edits it. Admins get `null` too: the
 * offering actions refuse them, as the course actions do, so the button would
 * only lead to errors.
 *
 * Viewer-specific like `getMyDraftCourses`, so it stays uncached and reads as the
 * member. Each offering comes from two reads: the collection row says whether it
 * is published and holds the publication, while a draft's newest revision only
 * lives in its versions, so drafts are read with `draft: true`.
 */
export const getManageableOfferings = async (
  courseId: number,
): Promise<ManageableOfferings | null> => {
  const { collection, user } = await getCurrentUser()
  if (collection !== Slugs.Collections.MEMBERS) return null

  const payload = await getPayloadClient()
  const course = await payload
    .findByID({
      collection: Slugs.Collections.COURSES,
      id: courseId,
      depth: 0,
      overrideAccess: false,
      user,
    })
    .catch((error: unknown) => {
      // A course the member can't read is simply not theirs to manage. Anything
      // else still hides the button, but is worth knowing about.
      if (!(error instanceof NotFound || error instanceof Forbidden))
        payload.logger.error({ err: error }, "getManageableOfferings failed")
      return null
    })
  // The rule the course hooks enforce, so the button shows exactly when they allow it.
  if (!course || !canEditCourse({ user: { ...user, collection } } as PayloadRequest, course))
    return null

  const read = (draft: boolean) =>
    payload.find({
      collection: Slugs.Collections.COURSE_VERSIONS,
      where: { course: { equals: courseId } },
      depth: 0,
      draft,
      overrideAccess: false,
      pagination: false,
      user,
    })
  const [{ docs: rows }, { docs: revisions }] = await Promise.all([read(false), read(true)])

  const newestRevision = new Map(revisions.map((revision) => [revision.id, revision]))
  const sources: ManageableOfferingSource[] = rows.map((row) =>
    row._status === "published"
      ? { status: "published", version: row }
      : { status: "draft", version: newestRevision.get(row.id) ?? row },
  )

  const role = user.position ?? ""
  return {
    courseCode: course.code,
    courseId,
    offerings: sources
      .sort(byStartNewestFirst)
      .map(({ version, status }) => toManageableOffering(version, status, role)),
    role,
  }
}
