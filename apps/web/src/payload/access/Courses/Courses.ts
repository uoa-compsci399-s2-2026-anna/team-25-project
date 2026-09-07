import type { Course } from "@repo/shared/payload-types"
import type { PayloadRequest } from "payload"
import { admin, member } from "../helpers"
import { courseReadAccess, courseWriteAccess, relationID } from "./helpers"

export const canEditCourse = (req: PayloadRequest, course: Course) =>
  admin(req) ||
  (member(req) &&
    (relationID(course.owner) === req.user?.id ||
      course.editors?.some((editor) => relationID(editor) === req.user?.id)))

export const courseRead = courseReadAccess("", { hasPublishedVersion: { equals: true } })

export const courseWrite = courseWriteAccess("")
