import type { Course } from "@repo/shared/payload-types"
import type { Access, PayloadRequest, Where } from "payload"
import { admin, member } from "../helpers"
import { courseReadAccess, courseWriteAccess, relationID } from "./helpers"

export const canEditCourse = (req: PayloadRequest, course: Course) =>
  admin(req) ||
  (member(req) &&
    (relationID(course.owner) === req.user?.id ||
      course.editors?.some((editor) => relationID(editor) === req.user?.id)))

export const courseRead = courseReadAccess("", { hasPublishedVersion: { equals: true } })

export const courseWrite = courseWriteAccess("")

// Set by deleteCourse to the id of the course an admin is deleting, so its published
// offerings can go with it. assertVersionDeletable only honours it for an admin and that
// course, so published history stays permanent everywhere else.
export const COURSE_DELETE = "courseDelete"

// Admins delete only through deleteCourse, which takes the offerings with it, so the
// panel's own Delete is hidden. Members may delete only never-published courses they own.
export const courseDelete: Access = ({ req }) => {
  if (admin(req)) return req.context[COURSE_DELETE] !== undefined
  if (!member(req)) return false
  const ownDraft: Where = {
    and: [{ owner: { equals: req.user?.id } }, { hasPublishedVersion: { not_equals: true } }],
  }
  return ownDraft
}
