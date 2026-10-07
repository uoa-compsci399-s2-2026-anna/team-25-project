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

// Members may delete only never-published courses they own.
export const courseDelete: Access = ({ req }) => {
  if (admin(req)) return true
  if (!member(req)) return false
  const ownDraft: Where = {
    and: [{ owner: { equals: req.user?.id } }, { hasPublishedVersion: { not_equals: true } }],
  }
  return ownDraft
}
