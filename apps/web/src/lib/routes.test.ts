import { describe, expect, it } from "vitest"
import { Routes } from "@/lib/routes"

describe("Routes", () => {
  it("builds a course route from an id", () => {
    expect(Routes.COURSES.COURSE("123")).toBe("/courses/123")
  })

  it("builds a member route from an id", () => {
    expect(Routes.MEMBERS.MEMBER("456")).toBe("/members/456")
  })

  it("builds a proposal route from an id", () => {
    expect(Routes.PROPOSALS.PROPOSAL("789")).toBe("/proposals/789")
  })
})
