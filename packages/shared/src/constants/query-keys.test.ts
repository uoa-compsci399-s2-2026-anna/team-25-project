import { describe, expect, it } from "vitest"
import { QueryKeys } from "./query-keys"

describe("QueryKeys", () => {
  it("keeps the public cache tag names stable", () => {
    expect(QueryKeys).toEqual({
      INSTITUTIONS: "institutions",
      PROPOSALS: "proposals",
      COURSES: {
        ROOT: "courses",
        ID: expect.any(Function),
      },
      MEMBERS: {
        ROOT: "members",
        ID: expect.any(Function),
      },
    })
    expect(QueryKeys.COURSES.ID(7)).toBe("courses:7")
    expect(QueryKeys.MEMBERS.ID(7)).toBe("member:7")
  })
})
