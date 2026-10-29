import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { RESOURCE_DELETE } from "@/payload/access/Resources"
import { deleteResourceAndAttachments } from "./deleteResourceAndAttachments"

const { APIError } = vi.hoisted(() => {
  class APIError extends Error {
    status: number
    constructor(message: string, status = 400) {
      super(message)
      this.status = status
    }
  }
  return { APIError }
})

vi.mock("payload", () => ({ APIError }))
vi.mock("next/cache", () => ({ updateTag: vi.fn() }))
vi.mock("@/lib/payload/getPayloadClient", () => ({ getPayloadClient: vi.fn() }))
vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))

const FALLBACK_ERROR = "Could not delete this resource. Try again."

const admin = { collection: "admin" as const, user: { id: 1 } }

const mockPayload = (overrides: Record<string, unknown> = {}) => {
  const payload = {
    count: vi.fn().mockResolvedValue({ totalDocs: 0 }),
    db: {
      beginTransaction: vi.fn().mockResolvedValue(1),
      commitTransaction: vi.fn().mockResolvedValue(undefined),
      rollbackTransaction: vi.fn().mockResolvedValue(undefined),
    },
    delete: vi.fn().mockResolvedValue({}),
    findByID: vi.fn().mockResolvedValue({ id: 3, attachments: [20, 21] }),
    logger: { error: vi.fn() },
    ...overrides,
  }
  // biome-ignore lint/suspicious/noExplicitAny: minimal Payload mock, only the operations the action calls
  vi.mocked(getPayloadClient).mockResolvedValue(payload as any)
  return payload
}

describe("deleteResourceAndAttachments", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue(admin as any)
  })

  it("deletes the resource, then its files, in one transaction, as the admin", async () => {
    const payload = mockPayload()

    expect(await deleteResourceAndAttachments({ resourceId: 3 })).toEqual({ ok: true })

    const deleted = payload.delete.mock.calls.map(([args]) => [args.collection, args.id])
    expect(deleted).toEqual([
      ["resources", 3],
      ["resourceAttachments", 20],
      ["resourceAttachments", 21],
    ])
    expect(payload.delete.mock.calls[0][0]).toMatchObject({
      context: { [RESOURCE_DELETE]: true },
    })
    for (const [args] of payload.delete.mock.calls) {
      expect(args).toMatchObject({
        overrideAccess: false,
        req: { transactionID: 1 },
        user: admin.user,
      })
    }
    // The count must not see the resource being deleted.
    expect(payload.delete.mock.invocationCallOrder[0]).toBeLessThan(
      payload.count.mock.invocationCallOrder[0],
    )
    expect(payload.db.commitTransaction).toHaveBeenCalledWith(1)
    expect(updateTag).toHaveBeenCalledWith(QueryKeys.RESOURCES.ROOT)
    expect(updateTag).toHaveBeenCalledWith(QueryKeys.RESOURCES.ID(3))
  })

  it("keeps a file that another resource also links to", async () => {
    const payload = mockPayload({
      count: vi
        .fn()
        .mockResolvedValueOnce({ totalDocs: 1 })
        .mockResolvedValueOnce({ totalDocs: 0 }),
    })

    expect(await deleteResourceAndAttachments({ resourceId: 3 })).toEqual({ ok: true })

    expect(payload.count).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "resources",
        where: { attachments: { contains: 20 } },
      }),
    )
    const deleted = payload.delete.mock.calls.map(([args]) => [args.collection, args.id])
    expect(deleted).toEqual([
      ["resources", 3],
      ["resourceAttachments", 21],
    ])
  })

  it.each([[{}], [{ resourceId: 0 }], [{ resourceId: "3" }], [null]])(
    "refuses %o without touching Payload",
    async (input) => {
      const payload = mockPayload()

      expect(await deleteResourceAndAttachments(input)).toEqual({
        formError: FALLBACK_ERROR,
        ok: false,
      })
      expect(payload.db.beginTransaction).not.toHaveBeenCalled()
    },
  )

  it("refuses when nobody is signed in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })
    const payload = mockPayload()

    expect(await deleteResourceAndAttachments({ resourceId: 3 })).toEqual({
      formError: "Sign in to delete a resource.",
      ok: false,
    })
    expect(payload.db.beginTransaction).not.toHaveBeenCalled()
  })

  it("refuses a member, even the resource's owner", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: "members", user: { id: 7 } } as any)
    const payload = mockPayload()

    expect(await deleteResourceAndAttachments({ resourceId: 3 })).toEqual({
      formError: "Only an admin can delete a resource with its files.",
      ok: false,
    })
    expect(payload.db.beginTransaction).not.toHaveBeenCalled()
  })

  it("says the resource is gone when it was already deleted", async () => {
    const payload = mockPayload({
      findByID: vi.fn().mockRejectedValue(new APIError("Not Found", 404)),
    })

    expect(await deleteResourceAndAttachments({ resourceId: 3 })).toEqual({
      formError: "This resource or one of its files no longer exists. Reload the page.",
      ok: false,
    })
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith(1)
  })

  it("shows a hook's refusal as it is", async () => {
    mockPayload({ delete: vi.fn().mockRejectedValue(new APIError("Forbidden", 403)) })

    expect(await deleteResourceAndAttachments({ resourceId: 3 })).toEqual({
      formError: "Forbidden",
      ok: false,
    })
  })

  it("rolls back, logs and gives the fallback message when a delete fails", async () => {
    const payload = mockPayload({
      delete: vi.fn().mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("s3 down")),
    })

    expect(await deleteResourceAndAttachments({ resourceId: 3 })).toEqual({
      formError: FALLBACK_ERROR,
      ok: false,
    })
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith(1)
    expect(payload.db.commitTransaction).not.toHaveBeenCalled()
    expect(payload.logger.error).toHaveBeenCalled()
    expect(updateTag).not.toHaveBeenCalled()
  })

  it("still succeeds when the cache update fails after the delete", async () => {
    const payload = mockPayload()
    vi.mocked(updateTag).mockImplementationOnce(() => {
      throw new Error("cache down")
    })

    expect(await deleteResourceAndAttachments({ resourceId: 3 })).toEqual({ ok: true })
    expect(payload.logger.error).toHaveBeenCalled()
  })
})
