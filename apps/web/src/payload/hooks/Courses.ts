import { isDeepStrictEqual } from "node:util"
import { QueryKeys } from "@repo/shared/constants/query-keys"
import type { Course } from "@repo/shared/payload-types"
import { revalidateTag } from "next/cache"
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeDeleteHook,
  CollectionBeforeValidateHook,
  PayloadRequest,
  Where,
} from "payload"
import { Slugs } from "@/lib/payload/slugs"
import { relationID } from "../access/Courses/helpers"
import { admin, member } from "../access/helpers"
import { fail, isInternal, lockCourse, requireEditor, requireID } from "./helpers"

async function assignMemberOwner(req: PayloadRequest, course: Partial<Course>) {
  const owner = await req.payload.findByID({
    collection: Slugs.Collections.MEMBERS,
    id: requireID(req.user),
    depth: 0,
    req,
    overrideAccess: true,
  })

  course.owner = owner.id
  course.institution = relationID(owner.institution)
}

function validateCourseChanges(req: PayloadRequest, next: Partial<Course>, current?: Course) {
  if (current && !admin(req)) {
    if (relationID(next.owner) !== relationID(current.owner))
      fail("Only admins can transfer ownership.", 403)
    if (
      relationID(current.owner) !== req.user?.id &&
      !isDeepStrictEqual(
        (next.editors ?? []).map(relationID),
        (current.editors ?? []).map(relationID),
      )
    )
      fail("Only the owner or an admin can manage editors.", 403)

    // A create takes the institution from the signed-in member rather than the request
    // (see assignMemberOwner), so an update must not become the way around that. Codes are
    // unique per institution, so a move would also claim a code in a namespace the member
    // has no standing in. This holds whether or not the course has been published.
    if (relationID(next.institution) !== relationID(current.institution))
      fail("Only admins can move a course to another institution.", 403)
  }

  if (
    current?.hasPublishedVersion &&
    (next.code !== current.code || relationID(next.institution) !== relationID(current.institution))
  )
    fail("Published course identity cannot change.")
}

export const prepareCourse: CollectionBeforeValidateHook<Course> = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!data || isInternal()) return data

  const current = operation === "update" ? await lockCourse(req, originalDoc?.id) : undefined
  if (current) requireEditor(req, current)
  else if (!admin(req) && !member(req)) fail("Sign in to create a course.", 403)

  if (
    data.hasPublishedVersion !== undefined &&
    data.hasPublishedVersion !== (current?.hasPublishedVersion ?? false)
  )
    fail("Publication metadata is server-managed.")

  const next = { ...current, ...data }
  next.code = typeof next.code === "string" ? next.code.trim().toUpperCase() : next.code
  if (!current && member(req)) await assignMemberOwner(req, next)
  validateCourseChanges(req, next, current)
  next.hasPublishedVersion = current?.hasPublishedVersion ?? false

  return next
}

export const revalidateCourse = (courseId: number) => {
  revalidateTag(QueryKeys.COURSES.ROOT, "max")
  revalidateTag(QueryKeys.COURSES.ID(courseId), "max")
}

export const revalidateCourses: CollectionAfterChangeHook<Course> = ({ doc, req }) => {
  if (!req.context.disableRevalidate) revalidateCourse(doc.id)
  return doc
}

export const revalidateDeletedCourse: CollectionAfterDeleteHook<Course> = ({ doc, req }) => {
  if (!req.context.disableRevalidate) revalidateCourse(doc.id)
  return doc
}

export const assertCourseDeletable: CollectionBeforeDeleteHook = async ({ id, req }) => {
  if (!admin(req)) fail("Only admins can delete courses.", 403)

  await lockCourse(req, relationID(id))

  const countVersions = (where: Where) =>
    req.payload.count({
      collection: Slugs.Collections.COURSE_VERSIONS,
      where: { course: { equals: id }, ...where },
      req,
      overrideAccess: true,
    })

  // The two cases need different messages: drafts can be cleared and the course then
  // deleted, published history cannot, so telling an admin to clear drafts first only
  // sends them to a second refusal from assertVersionDeletable.
  const published = await countVersions({
    or: [{ _status: { equals: "published" } }, { publishedAt: { exists: true } }],
  })

  if (published.totalDocs)
    fail("This course has published offerings. Their history is permanent.", 409)

  const drafts = await countVersions({})
  if (drafts.totalDocs) fail("Delete the course's draft offerings first.", 409)
}
