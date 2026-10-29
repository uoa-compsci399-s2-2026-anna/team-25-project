import type { Course } from "@repo/shared/payload-types"
import type { PayloadRequest } from "payload"
import { describe, expect, it } from "vitest"
import { Slugs } from "@/lib/payload/slugs"
import { COURSE_DELETE, canEditCourse, courseDelete, courseRead, courseWrite } from "./Courses"

const request = (user: unknown) => ({ user }) as PayloadRequest

const adminReq = request({ id: 1, collection: Slugs.Collections.ADMIN })
const memberReq = (id: number) => request({ id, collection: Slugs.Collections.MEMBERS })

const course = (overrides: Partial<Course> = {}) =>
  ({ id: 1, owner: 42, editors: [], ...overrides }) as Course

describe("canEditCourse", () => {
  it("allows an admin any course", () => {
    expect(canEditCourse(adminReq, course())).toBe(true)
  })

  it("allows the owner", () => {
    expect(canEditCourse(memberReq(42), course())).toBe(true)
  })

  it.each([
    ["an ID", [7]],
    ["a populated document", [{ id: 7 }]],
  ])("allows an editor listed as %s", (_label, editors) => {
    expect(canEditCourse(memberReq(7), course({ editors } as Partial<Course>))).toBe(true)
  })

  it("resolves a populated owner document", () => {
    expect(canEditCourse(memberReq(42), course({ owner: { id: 42 } } as Partial<Course>))).toBe(
      true,
    )
  })

  it("denies a member who neither owns nor edits the course", () => {
    expect(canEditCourse(memberReq(9), course({ editors: [7] } as Partial<Course>))).toBe(false)
  })

  it("denies a member when the course lists no editors", () => {
    expect(canEditCourse(memberReq(9), course({ editors: undefined }))).toBeFalsy()
  })

  it("denies an anonymous request", () => {
    expect(canEditCourse(request(null), course())).toBe(false)
  })
})

describe("course collection access", () => {
  it("hides every course from an anonymous request", () => {
    expect(courseRead({ req: request(null) })).toBe(false)
  })

  it("constrains a member's writes to their own courses", () => {
    expect(courseWrite({ req: memberReq(42) })).toEqual({
      or: [{ owner: { equals: 42 } }, { editors: { contains: 42 } }],
    })
  })
  it("lets an admin delete a course only through deleteCourse", () => {
    expect(courseDelete({ req: { ...adminReq, context: {} } as PayloadRequest })).toBe(false)
    expect(
      courseDelete({ req: { ...adminReq, context: { [COURSE_DELETE]: 4 } } as PayloadRequest }),
    ).toBe(true)
  })

  it("lets a member delete only never-published courses they own", () => {
    expect(courseDelete({ req: memberReq(42) })).toEqual({
      and: [{ owner: { equals: 42 } }, { hasPublishedVersion: { not_equals: true } }],
    })
  })

  it("lets an anonymous request delete nothing", () => {
    expect(courseDelete({ req: request(null) })).toBe(false)
  })
})
