import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { deleteDraftCourse } from "./deleteDraftCourse"

const { APIError, ValidationError } = vi.hoisted(() => {
  class ValidationError extends Error {
    data = { errors: [] }
  }
  class APIError extends Error {}
  return { APIError, ValidationError }
})

vi.mock("payload", () => ({ APIError, ValidationError }))
vi.mock("next/cache", () => ({ updateTag: vi.fn() }))
vi.mock("@/lib/payload/getPayloadClient", () => ({ getPayloadClient: vi.fn() }))
vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))

const member = { collection: "members" as const, user: { firstName: "Anna", id: 7 } }

const mockPayload = (overrides: Record<string, unknown> = {}) => {
  const payload = {
    db: {
      beginTransaction: vi.fn().mockResolvedValue(1),
      commitTransaction: vi.fn().mockResolvedValue(undefined),
      rollbackTransaction: vi.fn().mockResolvedValue(undefined),
    },
    delete: vi.fn().mockResolvedValue({}),
    find: vi.fn().mockResolvedValue({ docs: [{ id: 100 }, { id: 101 }] }),
    findByID: vi.fn().mockResolvedValue({ hasPublishedVersion: false, id: 4, owner: 7 }),
    logger: { error: vi.fn() },
    ...overrides,
  }
  // biome-ignore lint/suspicious/noExplicitAny: minimal Payload mock, only the operations the action calls
  vi.mocked(getPayloadClient).mockResolvedValue(payload as any)
  return payload
}

describe("deleteDraftCourse", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue(member as any)
  })

  it("refuses without touching Payload when the course id is missing", async () => {
    const payload = mockPayload()

    expect(await deleteDraftCourse({})).toEqual({
      formError: "Could not delete this draft. Try again.",
      ok: false,
    })
    expect(payload.delete).not.toHaveBeenCalled()
  })

  it("refuses when nobody is signed in", async () => {
    const payload = mockPayload()
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })

    expect(await deleteDraftCourse({ courseId: 4 })).toEqual({
      formError: "Sign in to delete a draft.",
      ok: false,
    })
    expect(payload.findByID).not.toHaveBeenCalled()
  })

  it("refuses an admin", async () => {
    const payload = mockPayload()
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "admin",
      // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
      user: { id: 1 } as any,
    })

    const result = await deleteDraftCourse({ courseId: 4 })

    expect(result).toHaveProperty("formError")
    expect(payload.findByID).not.toHaveBeenCalled()
  })

  it("deletes each draft offering, then the course, as the member in one transaction", async () => {
    const payload = mockPayload()

    expect(await deleteDraftCourse({ courseId: 4 })).toEqual({ ok: true })

    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "courseVersions",
        overrideAccess: false,
        where: { course: { equals: 4 } },
        user: member.user,
      }),
    )
    const deletes = payload.delete.mock.calls.map(([args]) => [args.collection, args.id])
    expect(deletes).toEqual([
      ["courseVersions", 100],
      ["courseVersions", 101],
      ["courses", 4],
    ])
    for (const [args] of payload.delete.mock.calls) {
      expect(args).toEqual(
        expect.objectContaining({
          overrideAccess: false,
          req: { transactionID: 1 },
          user: member.user,
        }),
      )
    }
    expect(payload.db.commitTransaction).toHaveBeenCalledWith(1)
    expect(updateTag).toHaveBeenCalledWith(QueryKeys.COURSES.ROOT)
  })

  it("refuses a course published since the table loaded, deleting nothing", async () => {
    const payload = mockPayload({
      findByID: vi.fn().mockResolvedValue({ hasPublishedVersion: true, id: 4, owner: 7 }),
    })

    expect(await deleteDraftCourse({ courseId: 4 })).toEqual({
      formError: "This course has already been published, so it can't be deleted.",
      ok: false,
    })
    expect(payload.delete).not.toHaveBeenCalled()
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith(1)
  })

  it("refuses an editor who doesn't own the course, deleting nothing", async () => {
    const payload = mockPayload({
      findByID: vi.fn().mockResolvedValue({ hasPublishedVersion: false, id: 4, owner: { id: 42 } }),
    })

    expect(await deleteDraftCourse({ courseId: 4 })).toEqual({
      formError: "Only the course's owner can delete this draft.",
      ok: false,
    })
    expect(payload.delete).not.toHaveBeenCalled()
  })

  it("rolls back and surfaces a hook's APIError when a delete is refused part way", async () => {
    const payload = mockPayload({
      delete: vi
        .fn()
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new APIError("Published offerings cannot be deleted.")),
    })

    expect(await deleteDraftCourse({ courseId: 4 })).toEqual({
      formError: "Published offerings cannot be deleted.",
      ok: false,
    })
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith(1)
    expect(payload.db.commitTransaction).not.toHaveBeenCalled()
    expect(updateTag).not.toHaveBeenCalled()
  })

  it("reports a generic failure, logs it and rolls back when Payload throws something else", async () => {
    const payload = mockPayload({
      find: vi.fn().mockRejectedValue(new Error("connection lost")),
    })

    expect(await deleteDraftCourse({ courseId: 4 })).toEqual({
      formError: "Could not delete this draft. Try again.",
      ok: false,
    })
    expect(payload.logger.error).toHaveBeenCalled()
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith(1)
  })
})
