import type { PayloadRequest } from "payload"
import { describe, expect, it } from "vitest"
import { Slugs } from "@/lib/payload/slugs"
import { courseReadAccess, courseWriteAccess, editableWhere, relationID } from "./helpers"

const request = (user: unknown) => ({ user }) as PayloadRequest

const adminReq = request({ id: 1, collection: Slugs.Collections.ADMIN })
const memberReq = request({ id: 42, collection: Slugs.Collections.MEMBERS })
const anonReq = request(null)

const published = { hasPublishedVersion: { equals: true } }

describe("relationID", () => {
  it.each([
    [7, 7],
    ["7", 7],
    [{ id: 7 }, 7],
    [{ id: "7" }, 7],
  ])("reads %j as %j", (value, expected) => {
    expect(relationID(value)).toBe(expected)
  })

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["a non-numeric string", "abc"],
    ["a decimal string", "7.5"],
    ["a negative string", "-7"],
    ["an object without an id", { code: "SE 101" }],
    ["a nested null id", { id: null }],
    ["a boolean", true],
  ])("returns undefined for %s", (_label, value) => {
    expect(relationID(value)).toBeUndefined()
  })
})

describe("editableWhere", () => {
  it("matches the courses a member owns or edits", () => {
    expect(editableWhere(memberReq, "")).toEqual({
      or: [{ owner: { equals: 42 } }, { editors: { contains: 42 } }],
    })
  })

  // Offering access resolves through the course, so the prefix walks the relationship.
  it("applies the relationship prefix", () => {
    expect(editableWhere(memberReq, "course.")).toEqual({
      or: [{ "course.owner": { equals: 42 } }, { "course.editors": { contains: 42 } }],
    })
  })
})

describe("courseReadAccess", () => {
  const access = courseReadAccess("course.", published)

  it("gives an admin unconstrained reads", () => {
    expect(access({ req: adminReq })).toBe(true)
  })

  it("adds the member's own courses to what is published", () => {
    expect(access({ req: memberReq })).toEqual({
      or: [
        published,
        { or: [{ "course.owner": { equals: 42 } }, { "course.editors": { contains: 42 } }] },
      ],
    })
  })

  it("limits an anonymous request to what is published", () => {
    expect(access({ req: anonReq })).toEqual({ or: [published] })
  })
})

describe("courseWriteAccess", () => {
  const access = courseWriteAccess("course.")

  it("gives an admin unconstrained writes", () => {
    expect(access({ req: adminReq })).toBe(true)
  })

  it("limits a member to the courses they own or edit", () => {
    expect(access({ req: memberReq })).toEqual({
      or: [{ "course.owner": { equals: 42 } }, { "course.editors": { contains: 42 } }],
    })
  })

  it("denies an anonymous request outright", () => {
    expect(access({ req: anonReq })).toBe(false)
  })
})
