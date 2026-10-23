import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { deleteDraftOffering } from "./deleteDraftOffering"

const { APIError, ValidationError } = vi.hoisted(() => {
  class ValidationError extends Error {}
  class APIError extends Error {}
  return { APIError, ValidationError }
})

vi.mock("payload", () => ({ APIError, ValidationError }))
vi.mock("next/cache", () => ({ updateTag: vi.fn() }))
vi.mock("@/lib/payload/getPayloadClient", () => ({ getPayloadClient: vi.fn() }))
vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))

const input = { courseId: 1, offeringId: 10 }

const offering = { _status: "draft", course: 1, id: 10 }

const member = { collection: "members" as const, user: { id: 7 } }

const mockPayload = (overrides: Record<string, unknown> = {}) => {
  const payload = {
    delete: vi.fn().mockResolvedValue(offering),
    findByID: vi.fn().mockResolvedValue(offering),
    logger: { error: vi.fn() },
    ...overrides,
  }
  // biome-ignore lint/suspicious/noExplicitAny: minimal Payload mock, only the operations the action calls
  vi.mocked(getPayloadClient).mockResolvedValue(payload as any)
  return payload
}

describe("deleteDraftOffering", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue(member as any)
  })

  it("deletes the draft as the member", async () => {
    const payload = mockPayload()

    const result = await deleteDraftOffering(input)

    expect(result).toEqual({ ok: true })
    expect(payload.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "courseVersions",
        id: 10,
        overrideAccess: false,
        user: member.user,
      }),
    )
    expect(updateTag).toHaveBeenCalledWith(QueryKeys.COURSES.ID(1))
  })

  it("refuses a published offering", async () => {
    const payload = mockPayload({
      findByID: vi.fn().mockResolvedValue({ ...offering, _status: "published" }),
    })

    const result = await deleteDraftOffering(input)

    expect(result).toEqual({
      formError: "This offering has already been published, so it can't be deleted.",
      ok: false,
    })
    expect(payload.delete).not.toHaveBeenCalled()
  })

  it("refuses an offering from another course", async () => {
    const payload = mockPayload({ findByID: vi.fn().mockResolvedValue({ ...offering, course: 2 }) })

    const result = await deleteDraftOffering(input)

    expect(result.ok).toBe(false)
    expect(payload.delete).not.toHaveBeenCalled()
  })

  it("shows a course hook's refusal as the form error", async () => {
    mockPayload({ delete: vi.fn().mockRejectedValue(new APIError("You cannot edit this course.")) })

    const result = await deleteDraftOffering(input)

    expect(result).toEqual({ formError: "You cannot edit this course.", ok: false })
  })
})
