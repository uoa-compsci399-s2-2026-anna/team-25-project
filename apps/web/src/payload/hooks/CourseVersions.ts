import { isDeepStrictEqual } from "node:util"
import type { Course, CourseVersion } from "@repo/shared/payload-types"
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeDeleteHook,
  CollectionBeforeValidateHook,
  PayloadRequest,
} from "payload"
import { Slugs } from "@/lib/payload/slugs"
import { relationID } from "../access/Courses/helpers"
import { admin } from "../access/helpers"
import { revalidateCourse } from "./Courses"
import {
  fail,
  internal,
  isInternal,
  lockCourse,
  requireEditor,
  requireID,
  VERSION_WRITE,
  type VersionMetadataKey,
  type VersionWrite,
  versionMetadataKeys,
} from "./helpers"

// Payload fills empty groups and nullable fields before collection validation.
function metadataValue(value: unknown): unknown {
  if (value == null) return undefined
  if (Array.isArray(value)) return value.length ? value.map(metadataValue) : undefined
  if (typeof value === "object") {
    const entries = Object.entries(value)
      .map(([key, child]) => [key, metadataValue(child)])
      .filter(([, child]) => child !== undefined)
    return entries.length ? Object.fromEntries(entries) : undefined
  }
  return value
}

const publicationKeys = [
  "name",
  "programme",
  "deliveryFormat",
  "projectType",
  "learningOutcomes",
  "assessments",
] as const

// Optional, so publication does not require it, but a correction can still change it.
const contentKeys = [
  "period",
  "startDate",
  "endDate",
  ...publicationKeys,
  "additionalInfo",
  "teachingTeam",
] as const

// Array row IDs and populated relationship objects are not content changes.
function content(version: Partial<CourseVersion>) {
  return contentKeys.map((key) => {
    if (key === "teachingTeam")
      return version.teachingTeam?.map((row) => ({
        member: relationID(row.member),
        role: row.role?.trim(),
      }))
    if (key === "startDate" || key === "endDate")
      return version[key] ? new Date(version[key]).toISOString() : null
    return version[key] ?? null
  })
}

// Reached only at a childless node: these render nothing on their own, and every
// other childless node is content. Requiring a text node would reject a field the
// editor can see, such as a document holding only an upload or a horizontal rule.
const blankLeafTypes = new Set(["paragraph", "linebreak", "tab"])

function hasContent(value: unknown): boolean {
  if (typeof value === "string") return Boolean(value.trim())
  if (!value || typeof value !== "object") return false

  const node = value as { children?: unknown; root?: unknown; text?: unknown; type?: unknown }
  if ("root" in node) return hasContent(node.root)
  if (Array.isArray(node.children)) return node.children.some(hasContent)
  if (typeof node.text === "string") return Boolean(node.text.trim())

  return typeof node.type === "string" && !blankLeafTypes.has(node.type)
}

export function validatePublication(version: Partial<CourseVersion>, previous?: CourseVersion) {
  for (const key of publicationKeys) {
    if (!hasContent(version[key])) fail(`${key} is required for publication.`)
  }

  if (
    !version.teachingTeam?.length ||
    version.teachingTeam.some((row) => !relationID(row.member) || !row.role?.trim())
  ) {
    fail("Publication requires a teaching team with a member and role in each row.")
  }

  if (previous) {
    // changeSummary persists, so an unchanged one is the previous correction's reason
    // carried forward by mergeWithSaved or round-tripped by the admin panel, not this
    // correction's. Requiring a new one keeps the history describing what it records.
    const summary = version.changeSummary?.trim()
    if (!summary) fail("A correction requires a change summary.")
    if (summary === previous.changeSummary?.trim())
      fail("A correction requires a change summary describing this change.")
    if (isDeepStrictEqual(content(version), content(previous)))
      fail("The correction has no content changes.")
  }
}

// findByID without `draft` reads the collection table, which holds the current
// publication of an offering, or its draft while it has never been published.
function readVersion(req: PayloadRequest, id: number | string) {
  return req.payload.findByID({
    collection: Slugs.Collections.COURSE_VERSIONS,
    id,
    depth: 0,
    req,
    overrideAccess: true,
  })
}

function isPublished(version: Pick<CourseVersion, "_status">) {
  return version._status === "published"
}

export function validateVersionChanges(
  data: Partial<CourseVersion>,
  sentMetadataKeys: ReadonlySet<VersionMetadataKey>,
  latest?: CourseVersion,
  publishing?: boolean,
) {
  // Publication rewrites the metadata, so there is nothing to protect there.
  if (!publishing) {
    // Only what the caller actually sent is a change. Payload fills `data` with an
    // empty group for every metadata field, which is not an attempt to write one.
    for (const key of versionMetadataKeys) {
      if (
        sentMetadataKeys.has(key) &&
        !isDeepStrictEqual(metadataValue(data[key]), metadataValue(latest?.[key]))
      )
        fail(`${key} is server-managed.`)
    }
  }

  if (latest && data.course !== undefined && relationID(data.course) !== relationID(latest.course))
    fail("The offering's course cannot change.")
}

// Not required for a draft save - a rough first cut of an offering can exist
// before its teaching period is settled. Anything else (a plain create/update,
// or a publish) still needs it.
function validatePeriod(version: Partial<CourseVersion>) {
  const start = Date.parse(version.startDate ?? "")
  const end = Date.parse(version.endDate ?? "")
  if (!version.period?.trim() || !Number.isFinite(start) || !Number.isFinite(end))
    fail("A period label and valid start and end dates are required.")

  if (end < start) fail("The end date cannot precede the start date.")
}

async function snapshotTeachingTeam(req: PayloadRequest, version: Partial<CourseVersion>) {
  const teachingTeam = []
  for (const row of version.teachingTeam ?? []) {
    const memberId = requireID(row.member)
    const person = await req.payload.findByID({
      collection: Slugs.Collections.MEMBERS,
      id: memberId,
      req,
      depth: 0,
      overrideAccess: true,
    })
    teachingTeam.push({ name: `${person.firstName} ${person.lastName}`, role: row.role, memberId })
  }

  return teachingTeam
}

async function createDisplaySnapshot(
  req: PayloadRequest,
  course: Course,
  version: Partial<CourseVersion>,
) {
  const institution = await req.payload.findByID({
    collection: Slugs.Collections.INSTITUTIONS,
    id: requireID(course.institution),
    req,
    depth: 0,
    overrideAccess: true,
  })

  return {
    courseCode: course.code,
    institutionName: institution.name,
    teachingTeam: await snapshotTeachingTeam(req, version),
  }
}

// The flag and the publication are written in one transaction, so a failed
// publication cannot leave a course advertising content nobody can read.
async function markCoursePublished(req: PayloadRequest, course: Course) {
  if (course.hasPublishedVersion) return

  await internal.run(true, () =>
    req.payload.update({
      collection: Slugs.Collections.COURSES,
      id: course.id,
      data: { hasPublishedVersion: true },
      req,
      overrideAccess: true,
    }),
  )
}

async function publishVersion(
  req: PayloadRequest,
  course: Course,
  next: Partial<CourseVersion>,
  previous?: CourseVersion,
): Promise<Partial<CourseVersion>> {
  validatePublication(next, previous)

  const metadata = {
    displaySnapshot: await createDisplaySnapshot(req, course, next),
    publishedAt: new Date().toISOString(),
    publishedBy: {
      relationTo: admin(req) ? Slugs.Collections.ADMIN : Slugs.Collections.MEMBERS,
      value: requireID(req.user),
    },
  }

  await markCoursePublished(req, course)

  return metadata as Partial<CourseVersion>
}

// Drops keys the request did not send, so a partial update keeps saved values.
function mergeWithSaved(latest: CourseVersion | undefined, data: Partial<CourseVersion>) {
  const sent = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined))

  return { ...latest, ...sent } as Partial<CourseVersion>
}

export const prepareVersion: CollectionBeforeValidateHook<CourseVersion> = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!data || isInternal()) return data

  const isCreate = operation === "create"
  const course = await lockCourse(req, relationID(isCreate ? data.course : originalDoc?.course))
  requireEditor(req, course)

  // `latest` is the newest revision, draft included.
  const latest = isCreate ? undefined : originalDoc
  if (!isCreate && !latest) fail("This offering was not found.", 404)

  const current = latest ? await readVersion(req, requireID(latest.id)) : undefined

  // `published` is what the  public can read: the offering's publication, while it has one.
  const published = current && isPublished(current) ? current : undefined

  // Set by guardCourseWrite, which runs before every create and update. Its
  // absence means this write reached validation off the expected path.
  const write = req.context[VERSION_WRITE] as VersionWrite | undefined
  if (!write) fail("This write did not pass through the course operation hook.", 500)

  // Payload keeps a write as a draft unless the request publishes it outright.
  // A write that omits `_status` leaves the stored one alone, and the stored status
  // is the publication's, not the newest draft's, so `current` decides the outcome.
  // Reading `latest` here would call a plain edit of a published offering that has a
  // pending draft an unpublish, which is the one thing it is not.
  const savingDraft = write.draft && data._status !== "published"
  const publishing = !savingDraft && (data._status ?? current?._status) === "published"

  // A draft save leaves the publication in place; any other write that lands in
  // the draft state would withdraw it.
  if (published && !publishing && !savingDraft)
    fail("Unpublishing is not supported. Withdrawal is a separate workflow.", 409)

  validateVersionChanges(data, write.sentMetadataKeys, latest, publishing)

  data.course = course.id
  const next = mergeWithSaved(latest, data)
  if (!savingDraft) validatePeriod(next)

  // Publication is the only writer of the metadata. Dropping the keys otherwise
  // leaves the stored columns untouched, so the guard above decides whether a
  // request is refused, never whether it reaches the row.
  if (publishing) Object.assign(data, await publishVersion(req, course, next, published))
  else for (const key of versionMetadataKeys) delete data[key]

  return data
}

const revalidateVersionCourse = (doc: CourseVersion, req: PayloadRequest) => {
  if (req.context.disableRevalidate) return
  const courseId = relationID(doc.course)
  if (courseId) revalidateCourse(courseId)
}

export const revalidateCourseVersions: CollectionAfterChangeHook<CourseVersion> = ({
  doc,
  req,
}) => {
  revalidateVersionCourse(doc, req)
  return doc
}

export const revalidateDeletedCourseVersion: CollectionAfterDeleteHook<CourseVersion> = ({
  doc,
  req,
}) => {
  revalidateVersionCourse(doc, req)
  return doc
}

export const assertVersionDeletable: CollectionBeforeDeleteHook = async ({ id, req }) => {
  requireEditor(req, await lockCourse(req, relationID((await readVersion(req, id)).course)))

  // Re-read under the lock: a concurrent publication may have changed the status.
  const version = await readVersion(req, id)

  if (isPublished(version) || version.publishedAt)
    fail("Published offerings cannot be deleted. Their history is permanent.", 409)
}
