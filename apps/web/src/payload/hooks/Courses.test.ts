import type { Course } from "@repo/shared/payload-types"
import { revalidateTag } from "next/cache"
import type { PayloadRequest } from "payload"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { lockDocument } from "@/lib/payload/lock"
import { Slugs } from "@/lib/payload/slugs"
import {
  assertCourseDeletable,
  prepareCourse,
  revalidateCourses,
  revalidateDeletedCourse,
} from "./Courses"
import { internal } from "./helpers"

vi.mock("@/lib/payload/lock", () => ({ lockDocument: vi.fn() }))
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }))

const owner = { id: 42, collection: Slugs.Collections.MEMBERS }
const editor = { id: 7, collection: Slugs.Collections.MEMBERS }
const stranger = { id: 9, collection: Slugs.Collections.MEMBERS }
const administrator = { id: 1, collection: Slugs.Collections.ADMIN }

const saved = (overrides: Partial<Course> = {}) =>
  ({
    id: 5,
    code: "SE 101",
    institution: 3,
    owner: 42,
    editors: [7],
    hasPublishedVersion: false,
    ...overrides,
  }) as Course

const request = (user: unknown, { member = { id: 42, institution: 3 }, counts = [0, 0] } = {}) => {
  const count = vi
    .fn()
    .mockResolvedValueOnce({ totalDocs: counts[0] })
    .mockResolvedValueOnce({ totalDocs: counts[1] })

  return {
    req: {
      user,
      context: {},
      payload: { findByID: vi.fn().mockResolvedValue(member), count },
    } as unknown as PayloadRequest,
    count,
  }
}

const prepare = (
  req: PayloadRequest,
  data: Partial<Course> | undefined,
  operation: "create" | "update" = "create",
  originalDoc?: Course,
) =>
  prepareCourse({ data, operation, originalDoc, req } as unknown as Parameters<
    typeof prepareCourse
  >[0]) as Promise<Partial<Course>>

beforeEach(() => {
  vi.mocked(lockDocument).mockReset()
  vi.mocked(revalidateTag).mockReset()
})

describe("course cache revalidation", () => {
  it.each([revalidateCourses, revalidateDeletedCourse])(
    "marks course queries stale after a write",
    async (hook) => {
      const doc = saved()
      const result = await hook({ doc, req: { context: {} } } as never)

      expect(revalidateTag).toHaveBeenCalledWith("courses", "max")
      expect(revalidateTag).toHaveBeenCalledWith("courses:5", "max")
      expect(result).toBe(doc)
    },
  )

  it.each([revalidateCourses, revalidateDeletedCourse])(
    "can skip revalidation through request context",
    async (hook) => {
      await hook({ doc: saved(), req: { context: { disableRevalidate: true } } } as never)

      expect(revalidateTag).not.toHaveBeenCalled()
    },
  )
})

describe("prepareCourse creation", () => {
  it("refuses a caller who is neither an admin nor a member", async () => {
    const { req } = request(null)
    await expect(prepare(req, { code: "se 101" })).rejects.toThrow("Sign in to create a course.")
  })

  it("takes the owner and institution from the signed-in member, not the request", async () => {
    const { req } = request(owner)

    await expect(prepare(req, { code: "se 101", owner: 99, institution: 99 })).resolves.toEqual({
      code: "SE 101",
      owner: 42,
      institution: 3,
      hasPublishedVersion: false,
    })
  })

  it("resolves a populated institution on the member record", async () => {
    const { req } = request(owner, { member: { id: 42, institution: { id: 8 } } as never })

    await expect(prepare(req, { code: "SE 101" })).resolves.toMatchObject({ institution: 8 })
  })

  it("leaves an admin's owner and institution as sent", async () => {
    const { req } = request(administrator)

    await expect(
      prepare(req, { code: "SE 101", owner: 42, institution: 3 }),
    ).resolves.toMatchObject({ owner: 42, institution: 3 })
  })

  it("normalises the course code", async () => {
    const { req } = request(administrator)
    await expect(prepare(req, { code: "  se 101  " })).resolves.toMatchObject({ code: "SE 101" })
  })

  it("leaves a code that is not a string for field validation to reject", async () => {
    const { req } = request(administrator)
    await expect(prepare(req, { code: null } as unknown as Partial<Course>)).resolves.toMatchObject(
      {
        code: null,
      },
    )
  })

  it("refuses a caller-supplied publication flag", async () => {
    const { req } = request(administrator)
    await expect(prepare(req, { code: "SE 101", hasPublishedVersion: true })).rejects.toThrow(
      "Publication metadata is server-managed.",
    )
  })

  it("accepts the flag when it matches the stored value", async () => {
    const { req } = request(administrator)
    await expect(
      prepare(req, { code: "SE 101", hasPublishedVersion: false }),
    ).resolves.toMatchObject({ hasPublishedVersion: false })
  })
})

describe("prepareCourse updates", () => {
  it("returns data untouched when there is none", async () => {
    const { req } = request(administrator)
    await expect(prepare(req, undefined)).resolves.toBeUndefined()
  })

  // A nested server write has already been authorised by the operation that started it.
  it("returns data untouched for an internal write", async () => {
    const { req } = request(null)
    const data = { hasPublishedVersion: true }

    await expect(internal.run(true, () => prepare(req, data, "update", saved()))).resolves.toBe(
      data,
    )
    expect(lockDocument).not.toHaveBeenCalled()
  })

  it("locks the course and refuses a caller who cannot edit it", async () => {
    vi.mocked(lockDocument).mockResolvedValue(saved())
    const { req } = request(stranger)

    await expect(prepare(req, { code: "SE 102" }, "update", saved())).rejects.toThrow(
      "You cannot edit this course.",
    )
    expect(lockDocument).toHaveBeenCalledWith(req, Slugs.Collections.COURSES, 5)
  })

  it("keeps values the update omits", async () => {
    vi.mocked(lockDocument).mockResolvedValue(saved())
    const { req } = request(owner)

    await expect(prepare(req, { code: "SE 102" }, "update", saved())).resolves.toMatchObject({
      code: "SE 102",
      institution: 3,
      owner: 42,
    })
  })

  it("refuses an ownership transfer by anyone but an admin", async () => {
    vi.mocked(lockDocument).mockResolvedValue(saved())
    const { req } = request(owner)

    await expect(prepare(req, { owner: 9 }, "update", saved())).rejects.toThrow(
      "Only admins can transfer ownership.",
    )
  })

  it("lets an admin transfer ownership", async () => {
    vi.mocked(lockDocument).mockResolvedValue(saved())
    const { req } = request(administrator)

    await expect(prepare(req, { owner: 9 }, "update", saved())).resolves.toMatchObject({ owner: 9 })
  })

  it("refuses an editor list change by an editor who is not the owner", async () => {
    vi.mocked(lockDocument).mockResolvedValue(saved())
    const { req } = request(editor)

    await expect(prepare(req, { editors: [7, 9] }, "update", saved())).rejects.toThrow(
      "Only the owner or an admin can manage editors.",
    )
  })

  it("lets the owner manage editors", async () => {
    vi.mocked(lockDocument).mockResolvedValue(saved())
    const { req } = request(owner)

    await expect(prepare(req, { editors: [7, 9] }, "update", saved())).resolves.toMatchObject({
      editors: [7, 9],
    })
  })

  // Populated relationships and IDs describe the same list.
  it("does not read a populated editor list as a change", async () => {
    vi.mocked(lockDocument).mockResolvedValue(saved())
    const { req } = request(editor)

    await expect(
      prepare(req, { editors: [{ id: 7 }] } as Partial<Course>, "update", saved()),
    ).resolves.toMatchObject({ code: "SE 101" })
  })

  it("reads a cleared editor list as a change", async () => {
    vi.mocked(lockDocument).mockResolvedValue(saved())
    const { req } = request(editor)

    await expect(
      prepare(req, { editors: null } as Partial<Course>, "update", saved()),
    ).rejects.toThrow("Only the owner or an admin can manage editors.")
  })

  // A create derives the institution from the member, so an update must not be the way
  // around that: moving an unpublished course claims a code in another institution's
  // namespace. Both the owner and a mere editor are refused.
  it.each([
    ["the owner", owner],
    ["an editor", editor],
  ])(
    "refuses to let %s move an unpublished course to another institution",
    async (_label, user) => {
      vi.mocked(lockDocument).mockResolvedValue(saved())
      const { req } = request(user)

      await expect(prepare(req, { institution: 8 }, "update", saved())).rejects.toThrow(
        "Only admins can move a course to another institution.",
      )
    },
  )

  it("lets an admin move an unpublished course to another institution", async () => {
    vi.mocked(lockDocument).mockResolvedValue(saved())
    const { req } = request(administrator)

    await expect(prepare(req, { institution: 8 }, "update", saved())).resolves.toMatchObject({
      institution: 8,
    })
  })

  it("leaves an update that does not send an institution alone", async () => {
    vi.mocked(lockDocument).mockResolvedValue(saved())
    const { req } = request(owner)

    await expect(prepare(req, { code: "SE 202" }, "update", saved())).resolves.toMatchObject({
      institution: 3,
    })
  })

  it.each([
    ["code", { code: "SE 999" }],
    ["institution", { institution: 8 }],
  ])("freezes the %s of a published course", async (_label, change) => {
    vi.mocked(lockDocument).mockResolvedValue(saved({ hasPublishedVersion: true }))
    const { req } = request(administrator)

    await expect(
      prepare(req, change, "update", saved({ hasPublishedVersion: true })),
    ).rejects.toThrow("Published course identity cannot change.")
  })

  it("preserves the stored publication flag", async () => {
    vi.mocked(lockDocument).mockResolvedValue(saved({ hasPublishedVersion: true }))
    const { req } = request(administrator)

    await expect(prepare(req, { code: "SE 101" }, "update", saved())).resolves.toMatchObject({
      hasPublishedVersion: true,
    })
  })
})

describe("assertCourseDeletable", () => {
  const remove = (req: PayloadRequest, id: unknown = 5) =>
    assertCourseDeletable({ id, req } as unknown as Parameters<typeof assertCourseDeletable>[0])

  it("refuses a member, even one who can edit the course", async () => {
    const { req } = request(owner)
    await expect(remove(req)).rejects.toThrow("Only admins can delete courses.")
  })

  it("refuses a course with published offerings", async () => {
    const { req } = request(administrator, { counts: [1, 0] })

    await expect(remove(req)).rejects.toThrow("This course has published offerings.")
  })

  it("asks an admin to clear drafts first", async () => {
    const { req } = request(administrator, { counts: [0, 2] })

    await expect(remove(req)).rejects.toThrow("Delete the course's draft offerings first.")
  })

  it("allows a course with no offerings, under the lock", async () => {
    const { req, count } = request(administrator)

    await expect(remove(req)).resolves.toBeUndefined()
    expect(lockDocument).toHaveBeenCalledWith(req, Slugs.Collections.COURSES, 5)
    expect(count).toHaveBeenCalledTimes(2)
  })

  // Published history is permanent whether the row still says so or only its
  // publication date does.
  it("counts an offering with a publication date as published", async () => {
    const { req, count } = request(administrator, { counts: [1, 0] })

    await expect(remove(req)).rejects.toThrow("Their history is permanent.")
    expect(count.mock.calls[0][0].where).toEqual({
      course: { equals: 5 },
      or: [{ _status: { equals: "published" } }, { publishedAt: { exists: true } }],
    })
  })
})
