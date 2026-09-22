import type { Access, PayloadRequest, Where } from "payload"
import { admin, member } from "../helpers"

export const relationID = (value: unknown): number | undefined => {
  const id = typeof value === "object" && value !== null && "id" in value ? value.id : value
  if (typeof id === "number") return id
  if (typeof id === "string" && /^\d+$/.test(id)) return Number(id)
  return undefined
}

// Permission always resolves through the course, so removing an editor withdraws
// their access to that course's offerings and to their history immediately.
export const editableWhere = (req: PayloadRequest, prefix: string): Where => ({
  or: [
    { [`${prefix}owner`]: { equals: req.user?.id } },
    { [`${prefix}editors`]: { contains: req.user?.id } },
  ],
})

export const courseReadAccess =
  (prefix: string, published: Where): Access =>
  ({ req }) =>
    admin(req) ? true : { or: [published, ...(member(req) ? [editableWhere(req, prefix)] : [])] }

export const courseWriteAccess =
  (prefix: string): Access =>
  ({ req }) =>
    admin(req) || (member(req) ? editableWhere(req, prefix) : false)
