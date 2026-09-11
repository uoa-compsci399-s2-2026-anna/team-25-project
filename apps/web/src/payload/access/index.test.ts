import type { PayloadRequest } from "payload"
import { describe, expect, it } from "vitest"
import { Slugs } from "@/lib/payload/slugs"
import { canReadEmail, isAdmin, isAdminOrSelf, isSignedIn } from "./index"

const request = (user: unknown) => ({ req: { user } as PayloadRequest })

const adminUser = { id: 1, collection: Slugs.Collections.ADMIN }
const memberUser = { id: 42, collection: Slugs.Collections.MEMBERS }

describe("isAdmin", () => {
  it.each([
    ["an admin", adminUser, true],
    ["a member", memberUser, false],
    ["an anonymous request", null, false],
  ])("returns %s -> %j", (_label, user, expected) => {
    expect(isAdmin(request(user))).toBe(expected)
  })
})

describe("isAdminOrSelf", () => {
  it("allows an admin every record", () => {
    expect(isAdminOrSelf(request(adminUser))).toBe(true)
  })

  it("limits a member to their own record", () => {
    expect(isAdminOrSelf(request(memberUser))).toEqual({ id: { equals: 42 } })
  })

  it("denies an anonymous request", () => {
    expect(isAdminOrSelf(request(null))).toBe(false)
  })
})

describe("isSignedIn", () => {
  it.each([
    ["an admin", adminUser, true],
    ["a member", memberUser, true],
    ["an anonymous request", null, false],
  ])("returns %s -> %j", (_label, user, expected) => {
    expect(isSignedIn(request(user))).toBe(expected)
  })
})

describe("canReadEmail", () => {
  it("shows the address to any signed-in requester", () => {
    expect(canReadEmail({ ...request(memberUser), doc: { showEmailPublicly: false } })).toBe(true)
  })

  it("shows an opted-in address to anyone", () => {
    expect(canReadEmail({ ...request(null), doc: { showEmailPublicly: true } })).toBe(true)
  })

  it.each([
    ["an address that is not opted in", { showEmailPublicly: false }],
    ["a document without the field", {}],
    ["no document at all", undefined],
  ])("hides %s from an anonymous requester", (_label, doc) => {
    expect(canReadEmail({ ...request(null), doc })).toBe(false)
  })
})
