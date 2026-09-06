import type { PayloadRequest } from "payload"
import { describe, expect, it } from "vitest"
import { Slugs } from "@/lib/payload/slugs"
import { isAdminOrAuthors } from "./Proposals"

describe("isAdminOrAuthors", () => {
  it("denies anonymous requests", async () => {
    const req = { user: null } as PayloadRequest
    expect(await isAdminOrAuthors({ req })).toBe(false)
  })

  it("allows admins without an author constraint", async () => {
    const req = { user: { id: 1, collection: Slugs.Collections.ADMIN } } as PayloadRequest
    expect(await isAdminOrAuthors({ req })).toBe(true)
  })

  it.each([1, 42])("limits member %s to proposals they author", async (id) => {
    const req = { user: { id, collection: Slugs.Collections.MEMBERS } } as PayloadRequest
    expect(await isAdminOrAuthors({ req })).toEqual({ author: { equals: id } })
  })

  it("uses the authenticated member, not an author supplied in the update", async () => {
    const req = { user: { id: 42, collection: Slugs.Collections.MEMBERS } } as PayloadRequest
    expect(await isAdminOrAuthors({ req, id: 100, data: { author: [99] } })).toEqual({
      author: { equals: 42 },
    })
  })
})
