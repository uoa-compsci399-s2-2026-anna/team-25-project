import type { PayloadRequest } from "payload"
import { describe, expect, it } from "vitest"
import { Slugs } from "@/lib/payload/slugs"
import { isAdminOrOwner } from "./Resources"

describe("isAdminOrOwner", () => {
  it("denies anonymous requests", async () => {
    const req = { user: null } as PayloadRequest
    expect(await isAdminOrOwner({ req })).toBe(false)
  })

  it("allows admins without an owner constraint", async () => {
    const req = { user: { id: 1, collection: Slugs.Collections.ADMIN } } as PayloadRequest
    expect(await isAdminOrOwner({ req })).toBe(true)
  })

  it.each([1, 42])("limits member %s to resources they own", async (id) => {
    const req = { user: { id, collection: Slugs.Collections.MEMBERS } } as PayloadRequest
    expect(await isAdminOrOwner({ req })).toEqual({ owner: { equals: id } })
  })

  it("uses the authenticated member, not an owner supplied in the update", async () => {
    const req = { user: { id: 42, collection: Slugs.Collections.MEMBERS } } as PayloadRequest
    expect(await isAdminOrOwner({ req, id: 100, data: { owner: 99 } })).toEqual({
      owner: { equals: 42 },
    })
  })
})
