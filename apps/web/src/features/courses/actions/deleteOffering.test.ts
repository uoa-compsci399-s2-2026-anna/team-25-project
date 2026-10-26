import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { deleteOffering } from "./deleteOffering"

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

const FALLBACK_ERROR = "Could not delete this offering. Try again."
const NOT_OWNER = "Only the course's owner can delete an offering."

const owner = { collection: "members" as const, user: { id: 7 } }

const mockPayload = ({
  course = { id: 4, owner: 7 } as Record<string, unknown>,
  offering = { course: 4, id: 100 } as Record<string, unknown>,
  ...overrides
}: Record<string, unknown> = {}) => {
  const payload = {
    delete: vi.fn().mockResolvedValue({}),
    findByID: vi.fn(async ({ collection }: { collection: string }) =>
      collection === "courses" ? course : offering,
    ),
    logger: { error: vi.fn() },
    ...overrides,
  }
  // biome-ignore lint/suspicious/noExplicitAny: minimal Payload mock, only the operations the action calls
  vi.mocked(getPayloadClient).mockResolvedValue(payload as any)
  return payload
}

describe("deleteOffering", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue(owner as any)
  })

  it("deletes the offering as the course's owner, then refreshes the course", async () => {
    const payload = mockPayload()

    expect(await deleteOffering({ courseId: 4, offeringId: 100 })).toEqual({ ok: true })

    expect(payload.delete).toHaveBeenCalledWith({
      collection: "courseVersions",
      id: 100,
      overrideAccess: false,
      user: owner.user,
    })
    expect(updateTag).toHaveBeenCalledWith(QueryKeys.COURSES.ROOT)
    expect(updateTag).toHaveBeenCalledWith(QueryKeys.COURSES.ID(4))
  })

  it.each([[{}], [{ courseId: 4 }], [{ courseId: 4, offeringId: "100" }]])(
    "refuses %o without touching Payload",
    async (input) => {
      const payload = mockPayload()

      expect(await deleteOffering(input)).toEqual({ formError: FALLBACK_ERROR, ok: false })
      expect(payload.findByID).not.toHaveBeenCalled()
    },
  )

  it("refuses when nobody is signed in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })
    const payload = mockPayload()

    expect(await deleteOffering({ courseId: 4, offeringId: 100 })).toEqual({
      formError: "Sign in to delete an offering.",
      ok: false,
    })
    expect(payload.delete).not.toHaveBeenCalled()
  })

  it("refuses an admin, who deletes the whole course instead", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: "admin", user: { id: 1 } } as any)
    const payload = mockPayload()

    expect(await deleteOffering({ courseId: 4, offeringId: 100 })).toEqual({
      formError: NOT_OWNER,
      ok: false,
    })
    expect(payload.delete).not.toHaveBeenCalled()
  })

  it("refuses an editor who isn't the owner", async () => {
    const payload = mockPayload({ course: { editors: [7], id: 4, owner: 9 } })

    expect(await deleteOffering({ courseId: 4, offeringId: 100 })).toEqual({
      formError: NOT_OWNER,
      ok: false,
    })
    expect(payload.delete).not.toHaveBeenCalled()
  })

  it("refuses an offering from another course", async () => {
    const payload = mockPayload({ offering: { course: 5, id: 100 } })

    expect(await deleteOffering({ courseId: 4, offeringId: 100 })).toEqual({
      formError: FALLBACK_ERROR,
      ok: false,
    })
    expect(payload.delete).not.toHaveBeenCalled()
  })

  it("shows the hook's refusal for the course's last published offering", async () => {
    mockPayload({
      delete: vi
        .fn()
        .mockRejectedValue(
          new APIError(
            "This is the course's only published offering. Ask an admin to delete the course.",
            409,
          ),
        ),
    })

    expect(await deleteOffering({ courseId: 4, offeringId: 100 })).toEqual({
      formError: "This is the course's only published offering. Ask an admin to delete the course.",
      ok: false,
    })
    expect(updateTag).not.toHaveBeenCalled()
  })

  it("logs and gives the fallback message for anything else", async () => {
    const payload = mockPayload({ delete: vi.fn().mockRejectedValue(new Error("db down")) })

    expect(await deleteOffering({ courseId: 4, offeringId: 100 })).toEqual({
      formError: FALLBACK_ERROR,
      ok: false,
    })
    expect(payload.logger.error).toHaveBeenCalled()
  })

  it("still succeeds when the cache update fails after the delete", async () => {
    const payload = mockPayload()
    vi.mocked(updateTag).mockImplementationOnce(() => {
      throw new Error("cache down")
    })

    expect(await deleteOffering({ courseId: 4, offeringId: 100 })).toEqual({ ok: true })
    expect(payload.logger.error).toHaveBeenCalled()
  })
})
