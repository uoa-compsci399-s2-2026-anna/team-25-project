import type { PayloadRequest } from "payload"
import { describe, expect, it } from "vitest"
import { Slugs } from "@/lib/payload/slugs"
import { admin, member } from "./helpers"

const request = (user: unknown) => ({ user }) as PayloadRequest

describe("admin", () => {
  it("recognises a request authenticated against the admin collection", () => {
    expect(admin(request({ id: 1, collection: Slugs.Collections.ADMIN }))).toBe(true)
  })

  it.each([
    ["a member", { id: 1, collection: Slugs.Collections.MEMBERS }],
    ["an anonymous request", null],
    ["a user whose collection is missing", { id: 1 }],
  ])("rejects %s", (_label, user) => {
    expect(admin(request(user))).toBe(false)
  })
})

describe("member", () => {
  it("recognises a request authenticated against the members collection", () => {
    expect(member(request({ id: 1, collection: Slugs.Collections.MEMBERS }))).toBe(true)
  })

  it.each([
    ["an admin", { id: 1, collection: Slugs.Collections.ADMIN }],
    ["an anonymous request", null],
  ])("rejects %s", (_label, user) => {
    expect(member(request(user))).toBe(false)
  })
})
