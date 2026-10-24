import { describe, expect, it } from "vitest"
import { Routes } from "@/lib/routes"

describe("Routes", () => {
  it("builds a course route from an id", () => {
    expect(Routes.COURSES.COURSE("123")).toBe("/courses/123")
  })

  it("builds a course route to one of its offerings", () => {
    expect(Routes.COURSES.COURSE(123, 45)).toBe("/courses/123?offering=45")
  })

  it("builds a member route from an id", () => {
    expect(Routes.MEMBERS.MEMBER("456")).toBe("/members/456")
  })

  it("builds a resource route from an id", () => {
    expect(Routes.RESOURCES.RESOURCE("abc")).toBe("/resources/abc")
  })

  it.each([undefined, null, ""])(
    "builds a proposal route from an id when the slug is %j",
    (slug) => {
      expect(Routes.PROPOSALS.PROPOSAL(789, slug)).toBe("/proposals/789")
    },
  )

  it("puts the id before the slug, since the page resolves on the leading id", () => {
    expect(Routes.PROPOSALS.PROPOSAL(12, "peer-review")).toBe("/proposals/12-peer-review")
  })
})
