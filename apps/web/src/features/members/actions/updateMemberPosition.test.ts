import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { updateMemberPosition } from "./updateMemberPosition"

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

describe("updateMemberPosition", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue(member as any)
  })

  it("rejects input that isn't text", async () => {
    const payload = mockPayload()

    const result = await updateMemberPosition({ position: "Lecturer" })

    expect(result).toMatchObject({ ok: false })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("requires a position, like registration does", async () => {
    const payload = mockPayload()

    const result = await updateMemberPosition("   ")

    expect(result).toEqual({ formError: "Position is required", ok: false })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("rejects a position over the length limit", async () => {
    const payload = mockPayload()

    const result = await updateMemberPosition("x".repeat(101))

    expect(result).toEqual({ formError: "Keep your position under 100 characters", ok: false })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("refuses when nobody is signed in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })
    const payload = mockPayload()

    const result = await updateMemberPosition("Lecturer")

    expect(result).toEqual({ formError: "Sign in as a member to edit your position.", ok: false })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("saves the trimmed position to the signed-in member and refreshes their profile", async () => {
    const payload = mockPayload()

    const result = await updateMemberPosition("  Senior Lecturer ")

    expect(result).toEqual({ ok: true })
    expect(payload.update).toHaveBeenCalledWith({
      collection: "members",
      id: 7,
      data: { position: "Senior Lecturer" },
      user: member.user,
      overrideAccess: false,
    })
    expect(updateTag).toHaveBeenCalledWith(QueryKeys.MEMBERS.ID(7))
  })

  it("reports a form error and logs when the update fails", async () => {
    const payload = mockPayload({ update: vi.fn().mockRejectedValue(new Error("db down")) })

    const result = await updateMemberPosition("Lecturer")

    expect(result).toEqual({ formError: "Could not save your position. Try again.", ok: false })
    expect(payload.logger.error).toHaveBeenCalled()
    expect(updateTag).not.toHaveBeenCalled()
  })
})
