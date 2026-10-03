import type { PayloadRequest } from "payload"
import { describe, expect, it } from "vitest"
import { Slugs } from "@/lib/payload/slugs"
import { isAdminOrLinkedAuthor } from "./Publications"

describe("isAdminOrLinkedAuthor", () => {
  it("denies anonymous requests", async () => {
    const req = { user: null } as PayloadRequest
    expect(await isAdminOrLinkedAuthor({ req })).toBe(false)
  })

  it("allows admins without an author constraint", async () => {
    const req = { user: { id: 1, collection: Slugs.Collections.ADMIN } } as PayloadRequest
    expect(await isAdminOrLinkedAuthor({ req })).toBe(true)
  })

  it.each([1, 42])("limits member %s to publications that link them as an author", async (id) => {
    const req = { user: { id, collection: Slugs.Collections.MEMBERS } } as PayloadRequest
    expect(await isAdminOrLinkedAuthor({ req })).toEqual({ "authors.member": { equals: id } })
  })

  it("uses the authenticated member, not authors supplied in the update", async () => {
    const req = { user: { id: 42, collection: Slugs.Collections.MEMBERS } } as PayloadRequest
    expect(
      await isAdminOrLinkedAuthor({ req, id: 100, data: { authors: [{ name: "X", member: 99 }] } }),
    ).toEqual({ "authors.member": { equals: 42 } })
  })
})
