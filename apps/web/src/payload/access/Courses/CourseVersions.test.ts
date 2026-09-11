import type { PayloadRequest } from "payload"
import { describe, expect, it } from "vitest"
import { Slugs } from "@/lib/payload/slugs"
import { versionHistoryRead, versionRead, versionWrite } from "./CourseVersions"

const request = (user: unknown) => ({ req: { user } as PayloadRequest })

const adminUser = { id: 1, collection: Slugs.Collections.ADMIN }
const memberUser = { id: 42, collection: Slugs.Collections.MEMBERS }

const editable = (prefix: string) => ({
  or: [{ [`${prefix}owner`]: { equals: 42 } }, { [`${prefix}editors`]: { contains: 42 } }],
})

describe("versionRead", () => {
  it("gives an admin unconstrained reads", () => {
    expect(versionRead(request(adminUser))).toBe(true)
  })

  // Payload rewrites `_status` for draft reads, so this constraint also blocks a
  // public request that asks for a draft by ID.
  it("limits the public to published offerings", () => {
    expect(versionRead(request(null))).toEqual({ or: [{ _status: { equals: "published" } }] })
  })

  it("adds a member's own offerings to what is published", () => {
    expect(versionRead(request(memberUser))).toEqual({
      or: [{ _status: { equals: "published" } }, editable("course.")],
    })
  })
})

describe("versionHistoryRead", () => {
  it("gives an admin the whole history", () => {
    expect(versionHistoryRead(request(adminUser))).toBe(true)
  })

  // History holds unpublished drafts, so it never opens to the public.
  it("denies an anonymous request", () => {
    expect(versionHistoryRead(request(null))).toBe(false)
  })

  it("limits a member to the courses they own or edit", () => {
    expect(versionHistoryRead(request(memberUser))).toEqual(editable("version.course."))
  })
})

describe("versionWrite", () => {
  it("gives an admin unconstrained writes", () => {
    expect(versionWrite(request(adminUser))).toBe(true)
  })

  it("limits a member to their own courses' offerings", () => {
    expect(versionWrite(request(memberUser))).toEqual(editable("course."))
  })

  it("denies an anonymous request", () => {
    expect(versionWrite(request(null))).toBe(false)
  })
})
