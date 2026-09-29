import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { updateMemberBio } from "./updateMemberBio"

vi.mock("next/cache", () => ({ updateTag: vi.fn() }))
vi.mock("@/lib/payload/getPayloadClient", () => ({ getPayloadClient: vi.fn() }))
vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))

const member = { collection: "members" as const, user: { firstName: "Anna", id: 7 } }

const mockPayload = (overrides: Record<string, unknown> = {}) => {
  const payload = {
    logger: { error: vi.fn() },
    update: vi.fn().mockResolvedValue({}),
    ...overrides,
  }
  // biome-ignore lint/suspicious/noExplicitAny: minimal Payload mock, only the operations the action calls
  vi.mocked(getPayloadClient).mockResolvedValue(payload as any)
  return payload
}

describe("updateMemberBio", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue(member as any)
  })

  it("rejects input that isn't text", async () => {
    const payload = mockPayload()

    const result = await updateMemberBio(42)

    expect(result).toEqual({ formError: "Bio must be text.", ok: false })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("refuses when nobody is signed in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })
    const payload = mockPayload()

    const result = await updateMemberBio("Hello")

    expect(result).toMatchObject({ ok: false })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("refuses an admin, who has no member profile", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: "admin", user: { id: 1 } } as any)
    const payload = mockPayload()

    const result = await updateMemberBio("Hello")

    expect(result).toMatchObject({ ok: false })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("saves the trimmed bio to the signed-in member and refreshes their profile", async () => {
    const payload = mockPayload()

    const result = await updateMemberBio("  Researches peer assessment.  ")

    expect(result).toEqual({ ok: true })
    expect(payload.update).toHaveBeenCalledWith({
      collection: "members",
      id: 7,
      data: { bio: "Researches peer assessment." },
      user: member.user,
      overrideAccess: false,
    })
    expect(updateTag).toHaveBeenCalledWith(QueryKeys.MEMBERS.ID(7))
  })

  it("reports a form error and logs when the update fails", async () => {
    const payload = mockPayload({ update: vi.fn().mockRejectedValue(new Error("db down")) })

    const result = await updateMemberBio("Hello")

    expect(result).toEqual({ formError: "Could not save your bio. Try again.", ok: false })
    expect(payload.logger.error).toHaveBeenCalled()
    expect(updateTag).not.toHaveBeenCalled()
  })
})
