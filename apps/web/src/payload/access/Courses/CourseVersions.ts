import type { Access } from "payload"
import { admin, member } from "../helpers"
import { courseReadAccess, courseWriteAccess, editableWhere } from "./helpers"

// Payload rewrites this constraint to `version._status` for draft reads, so a
// public request cannot reach a draft through `draft=true` or a direct ID.
export const versionRead = courseReadAccess("course.", { _status: { equals: "published" } })

// Version history holds unpublished drafts, so it stays with the course's editors.
export const versionHistoryRead: Access = ({ req }) =>
  admin(req) || (member(req) ? editableWhere(req, "version.course.") : false)

export const versionWrite = courseWriteAccess("course.")
