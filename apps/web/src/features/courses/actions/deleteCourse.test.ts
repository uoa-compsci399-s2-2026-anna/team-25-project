import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { COURSE_DELETE } from "@/payload/hooks/helpers"
import { deleteCourse } from "./deleteCourse"

const { APIError, ValidationError } = vi.hoisted(() => {
  class ValidationError extends Error {
    data = { errors: [] }
  }
  class APIError extends Error {
    status: number
    constructor(message: string, status = 400) {
      super(message)
      this.status = status
    }
  }
  return { APIError, ValidationError }
})

vi.mock("payload", () => ({ APIError, ValidationError }))
vi.mock("next/cache", () => ({ updateTag: vi.fn() }))
vi.mock("@/lib/payload/getPayloadClient", () => ({ getPayloadClient: vi.fn() }))
vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))
vi.mock("@/lib/payload/lock", () => ({ lockDocument: vi.fn() }))

const FALLBACK_ERROR = "Could not delete this course. Try again."

const admin = { collection: "admin" as const, user: { id: 1 } }

const mockPayload = (overrides: Record<string, unknown> = {}) => {
  const payload = {
    db: {
      beginTransaction: vi.fn().mockResolvedValue(1),
      commitTransaction: vi.fn().mockResolvedValue(undefined),
      rollbackTransaction: vi.fn().mockResolvedValue(undefined),
    },
    delete: vi.fn().mockResolvedValue({}),
    find: vi.fn().mockResolvedValue({ docs: [{ id: 100 }, { id: 101 }] }),
    logger: { error: vi.fn() },
    ...overrides,
  }
  // biome-ignore lint/suspicious/noExplicitAny: minimal Payload mock, only the operations the action calls
  vi.mocked(getPayloadClient).mockResolvedValue(payload as any)
  return payload
}

describe("deleteCourse", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue(admin as any)
  })

  it("deletes every offering, then the course, in one transaction, as the admin", async () => {
    const payload = mockPayload()

    expect(await deleteCourse({ courseId: 4 })).toEqual({ ok: true })

    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "courseVersions",
        overrideAccess: false,
        where: { course: { equals: 4 } },
      }),
    )
    const deleted = payload.delete.mock.calls.map(([args]) => [args.collection, args.id])
    expect(deleted).toEqual([
      ["courseVersions", 100],
      ["courseVersions", 101],
      ["courses", 4],
    ])
    for (const [args] of payload.delete.mock.calls) {
      expect(args).toMatchObject({
        context: { [COURSE_DELETE]: 4 },
        overrideAccess: false,
        req: { transactionID: 1 },
        user: admin.user,
      })
    }
    expect(payload.db.commitTransaction).toHaveBeenCalledWith(1)
    expect(updateTag).toHaveBeenCalledWith(QueryKeys.COURSES.ROOT)
    expect(updateTag).toHaveBeenCalledWith(QueryKeys.COURSES.ID(4))
  })

  it.each([[{}], [{ courseId: 0 }], [{ courseId: "4" }], [null]])(
    "refuses %o without touching Payload",
    async (input) => {
      const payload = mockPayload()

      expect(await deleteCourse(input)).toEqual({ formError: FALLBACK_ERROR, ok: false })
      expect(payload.db.beginTransaction).not.toHaveBeenCalled()
    },
  )

  it("refuses when nobody is signed in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })
    const payload = mockPayload()

    expect(await deleteCourse({ courseId: 4 })).toEqual({
      formError: "Sign in to delete a course.",
      ok: false,
    })
    expect(payload.db.beginTransaction).not.toHaveBeenCalled()
  })

  it("refuses a member, even the course's owner", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: "members", user: { id: 7 } } as any)
    const payload = mockPayload()

    expect(await deleteCourse({ courseId: 4 })).toEqual({
      formError: "Only an admin can delete a course.",
      ok: false,
    })
    expect(payload.db.beginTransaction).not.toHaveBeenCalled()
  })

  it("rolls back and shows a hook's refusal as it is", async () => {
    const payload = mockPayload({
      delete: vi
        .fn()
        .mockRejectedValue(new APIError("Delete the course's draft offerings first.", 409)),
    })

    expect(await deleteCourse({ courseId: 4 })).toEqual({
      formError: "Delete the course's draft offerings first.",
      ok: false,
    })
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith(1)
    expect(updateTag).not.toHaveBeenCalled()
  })

  it("says the course is gone when it was already deleted", async () => {
    mockPayload({ delete: vi.fn().mockRejectedValue(new APIError("Not Found", 404)) })

    expect(await deleteCourse({ courseId: 4 })).toEqual({
      formError: "This course or offering no longer exists. Reload the page.",
      ok: false,
    })
  })

  it("rolls back, logs and gives the fallback message for anything else", async () => {
    const payload = mockPayload({ find: vi.fn().mockRejectedValue(new Error("db down")) })

    expect(await deleteCourse({ courseId: 4 })).toEqual({ formError: FALLBACK_ERROR, ok: false })
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith(1)
    expect(payload.logger.error).toHaveBeenCalled()
  })

  it("still succeeds when the cache update fails after the delete", async () => {
    const payload = mockPayload()
    vi.mocked(updateTag).mockImplementationOnce(() => {
      throw new Error("cache down")
    })

    expect(await deleteCourse({ courseId: 4 })).toEqual({ ok: true })
    expect(payload.logger.error).toHaveBeenCalled()
  })
})
