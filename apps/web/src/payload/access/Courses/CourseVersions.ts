import type { Access, PayloadRequest } from "payload"
import { admin, member } from "../helpers"
import { courseWriteAccess, editableWhere, staffOfferingIDs } from "./helpers"

const published = { _status: { equals: "published" } }

// Payload rewrites these constraints to `version.*` (and `id` to `parent`) for draft
// reads, so a member cannot reach another course's draft through `draft=true` or a direct ID.
export const versionRead: Access = async ({ req }) => {
  if (admin(req)) return true
  if (!member(req)) return false
  const staffOf = await staffOfferingIDs(req)
  return {
    or: [
      published,
      editableWhere(req, "course."),
      ...(staffOf.length ? [{ id: { in: staffOf } }] : []),
    ],
  }
}

// The course's editors, or the teaching staff of the offerings matched by `key`.
const editorsOrStaff = async (req: PayloadRequest, prefix: string, key: string) => {
  const staffOf = await staffOfferingIDs(req)
  const editable = editableWhere(req, prefix)
  return staffOf.length ? { or: [editable, { [key]: { in: staffOf } }] } : editable
}

// Version history holds unpublished drafts, so it stays with the course's editors and
// the offering's teaching staff.
export const versionHistoryRead: Access = ({ req }) =>
  admin(req) || (member(req) ? editorsOrStaff(req, "version.course.", "parent") : false)

export const versionUpdate: Access = ({ req }) =>
  admin(req) || (member(req) ? editorsOrStaff(req, "course.", "id") : false)

// Removing an offering is the course's business, not its teaching staff's.
export const versionDelete = courseWriteAccess("course.")
