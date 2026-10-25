import type { Access, PayloadRequest, Where } from "payload"
import { Slugs } from "@/lib/payload/slugs"
import { admin, member } from "../helpers"

export const relationID = (value: unknown): number | undefined => {
  const id = typeof value === "object" && value !== null && "id" in value ? value.id : value
  if (typeof id === "number") return id
  if (typeof id === "string" && /^\d+$/.test(id)) return Number(id)
  return undefined
}

// Course-wide permission resolves through the course, so removing an editor withdraws
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

// Teaching staff reach only the offerings that list them. The list is read from the
// collection table, which holds the publication, or for a never-published offering
// the newest draft's team (see syncUnpublishedTeam). So a pending draft over a
// publication cannot grant access, and removing a member from the published team
// withdraws it from every revision at once.
export async function staffOfferingIDs(req: PayloadRequest): Promise<number[]> {
  if (!member(req)) return []
  const { docs } = await req.payload.find({
    collection: Slugs.Collections.COURSE_VERSIONS,
    where: { "teachingTeam.member": { equals: req.user?.id } },
    depth: 0,
    pagination: false,
    select: { course: true },
    req,
    overrideAccess: true,
  })
  return docs.map((doc) => doc.id)
}
