import type { PayloadRequest } from "payload"
import { relationship } from "payload/shared"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { Slugs } from "@/lib/payload/slugs"
import { validateResourceCourse } from "./Resources"

vi.mock("payload/shared", () => ({ relationship: vi.fn() }))

const member = { id: 7, collection: Slugs.Collections.MEMBERS }
const administrator = { id: 1, collection: Slugs.Collections.ADMIN }

// Course 4 is edited by member 7; course 5 is not.
const courses: Record<number, unknown> = {
  4: { id: 4, owner: 42, editors: [7] },
  5: { id: 5, owner: 42, editors: [] },
}

const findByID = vi.fn(async ({ id }: { id: number }) => courses[id] ?? null)

const validate = (value: unknown, previousValue: unknown, user: unknown = member) =>
  validateResourceCourse(
    value as never,
    {
      previousValue,
      req: { payload: { findByID }, user } as unknown as PayloadRequest,
    } as never,
  )

describe("validateResourceCourse", () => {
  beforeEach(() => {
    findByID.mockClear()
    vi.mocked(relationship).mockReset().mockResolvedValue(true)
  })

  it("runs the built-in relationship checks without filterOptions", async () => {
    vi.mocked(relationship).mockResolvedValue(
      "This relationship field has the following invalid selections: 9",
    )

    await expect(validate(9, undefined)).resolves.toBe(
      "This relationship field has the following invalid selections: 9",
    )
    expect(relationship).toHaveBeenCalledWith(
      9,
      expect.objectContaining({ filterOptions: undefined }),
    )
  })

  it("accepts no course", async () => {
    await expect(validate(null, 5)).resolves.toBe(true)
    expect(findByID).not.toHaveBeenCalled()
  })

  it.each([
    ["an id", 5],
    ["a populated course", { id: 5 }],
  ])(
    "keeps saving an unchanged course stored as %s, even one the owner can no longer edit",
    async (_label, previousValue) => {
      await expect(validate(5, previousValue)).resolves.toBe(true)
      expect(findByID).not.toHaveBeenCalled()
    },
  )

  it("accepts a new course the user can edit", async () => {
    await expect(validate(4, 5)).resolves.toBe(true)
  })

  it.each([
    ["one the user cannot edit", 5],
    ["one that does not exist", 99],
  ])("refuses linking %s", async (_label, courseId) => {
    await expect(validate(courseId, undefined)).resolves.toBe(
      "You can only link courses you can edit.",
    )
  })

  it("lets an admin link any course", async () => {
    await expect(validate(5, undefined, administrator)).resolves.toBe(true)
  })
})
