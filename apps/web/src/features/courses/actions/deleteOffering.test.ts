import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { deleteOffering } from "./deleteOffering"

const { APIError, ValidationError } = vi.hoisted(() => {
  class ValidationError extends Error {
    data: { errors: { message: string; path: string }[] }
    constructor(errors: { message: string; path: string }[]) {
      super("Validation failed")
      this.data = { errors }
    }
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
    create: vi.fn().mockResolvedValue({ id: 200 }),
    db: {
      beginTransaction: vi.fn().mockResolvedValue(1),
      commitTransaction: vi.fn().mockResolvedValue(undefined),
      rollbackTransaction: vi.fn().mockResolvedValue(undefined),
    },
    delete: vi.fn().mockResolvedValue({}),
    findByID: vi.fn(),
    logger: { error: vi.fn() },
    update: vi.fn().mockResolvedValue({}),
    ...overrides,
  }
  // biome-ignore lint/suspicious/noExplicitAny: minimal Payload mock, only the operations the action calls
  vi.mocked(getPayloadClient).mockResolvedValue(payload as any)
  return payload
}

beforeEach(() => {
  vi.clearAllMocks()
  // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
  vi.mocked(getCurrentUser).mockResolvedValue(member as any)
})

const input = { courseId: 1, offeringId: 4 }

describe("deleteOffering", () => {
  it("deletes a draft offering of the course as the member", async () => {
    const payload = mockPayload({
      findByID: vi.fn().mockResolvedValue({ _status: "draft", course: 1, id: 4 }),
    })

    const result = await deleteOffering(input)

    expect(result).toEqual({ ok: true })
    expect(payload.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "courseVersions",
        id: 4,
        overrideAccess: false,
        user: member.user,
      }),
    )
    expect(payload.db.commitTransaction).toHaveBeenCalledWith(1)
    expect(updateTag).toHaveBeenCalledWith(QueryKeys.COURSES.ID(1))
  })

  it("refuses a published offering", async () => {
    const payload = mockPayload({
      findByID: vi.fn().mockResolvedValue({ _status: "published", course: 1, id: 4 }),
    })

    const result = await deleteOffering(input)

    expect(result).toEqual({
      formError: "This offering has been published, so it can't be deleted.",
      ok: false,
    })
    expect(payload.delete).not.toHaveBeenCalled()
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith(1)
  })

  it("refuses an offering from another course", async () => {
    const payload = mockPayload({
      findByID: vi.fn().mockResolvedValue({ _status: "draft", course: 2, id: 4 }),
    })

    const result = await deleteOffering(input)

    expect(result).toEqual({ formError: "Could not delete this draft. Try again.", ok: false })
    expect(payload.delete).not.toHaveBeenCalled()
  })

  it("refuses an admin", async () => {
    const payload = mockPayload()
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: "admin", user: { id: 1 } as any })

    const result = await deleteOffering(input)

    expect(result).toEqual({
      formError: "Only members can delete a draft - admins can use the admin panel.",
      ok: false,
    })
    expect(payload.findByID).not.toHaveBeenCalled()
  })

  it("shows the hooks' refusal of a member who can't edit the course", async () => {
    mockPayload({
      delete: vi.fn().mockRejectedValue(new APIError("You cannot edit this course.")),
      findByID: vi.fn().mockResolvedValue({ _status: "draft", course: 1, id: 4 }),
    })

    const result = await deleteOffering(input)

    expect(result).toEqual({ formError: "You cannot edit this course.", ok: false })
  })
})
