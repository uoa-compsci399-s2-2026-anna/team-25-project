import type { PayloadRequest, RelationshipField } from "payload"
import { describe, expect, it } from "vitest"
import { Slugs } from "@/lib/payload/slugs"
import { validateResourceCourse } from "../validation/Resources"
import { Resources } from "./Resources"

const findField = (name: string) =>
  Resources.fields.find((field) => "name" in field && field.name === name)

const ownerField = findField("owner") as RelationshipField
const courseField = findField("course") as RelationshipField

describe("Resources collection", () => {
  it.each(["course", "attachments"])("keeps %s optional", (name) => {
    expect(findField(name)).not.toHaveProperty("required", true)
  })

  it("takes many attachments from the attachments collection", () => {
    expect(findField("attachments")).toMatchObject({
      type: "upload",
      relationTo: Slugs.Collections.RESOURCE_ATTACHMENTS,
      hasMany: true,
    })
  })

  it("lets only admins transfer ownership", async () => {
    const update = ownerField.access?.update
    const member = { user: { id: 1, collection: Slugs.Collections.MEMBERS } } as PayloadRequest
    const admin = { user: { id: 1, collection: Slugs.Collections.ADMIN } } as PayloadRequest

    expect(await update?.({ req: member })).toBe(false)
    expect(await update?.({ req: admin })).toBe(true)
  })

  it("offers only the courses the user can write to", async () => {
    const filterOptions = courseField.filterOptions as (args: { req: PayloadRequest }) => unknown
    const member = { user: { id: 7, collection: Slugs.Collections.MEMBERS } } as PayloadRequest
    const admin = { user: { id: 1, collection: Slugs.Collections.ADMIN } } as PayloadRequest

    expect(await filterOptions({ req: member })).toEqual({
      or: [{ owner: { equals: 7 } }, { editors: { contains: 7 } }],
    })
    expect(await filterOptions({ req: admin })).toBe(true)
  })

  it("checks the course on save only when it changes", () => {
    expect(courseField.validate).toBe(validateResourceCourse)
  })
})
