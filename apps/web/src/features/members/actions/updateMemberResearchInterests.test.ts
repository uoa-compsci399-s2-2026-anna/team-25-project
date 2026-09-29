import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { updateMemberResearchInterests } from "./updateMemberResearchInterests"

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

describe("updateMemberResearchInterests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue(member as any)
  })

  it("rejects input that isn't a list of text", async () => {
    const payload = mockPayload()

    const result = await updateMemberResearchInterests("Code review")

    expect(result).toMatchObject({ ok: false })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("rejects an interest over the length limit", async () => {
    const payload = mockPayload()

    const result = await updateMemberResearchInterests(["x".repeat(51)])

    expect(result).toEqual({ formError: "Keep each interest under 50 characters", ok: false })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("rejects more than ten interests", async () => {
    const payload = mockPayload()

    const result = await updateMemberResearchInterests(
      Array.from({ length: 11 }, (_, i) => `Interest ${i}`),
    )

    expect(result).toEqual({ formError: "Add up to 10 research interests", ok: false })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("refuses when nobody is signed in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })
    const payload = mockPayload()

    const result = await updateMemberResearchInterests(["Code review"])

    expect(result).toEqual({
      formError: "Sign in as a member to edit your research interests.",
      ok: false,
    })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("saves the trimmed interests without blanks or repeats, then refreshes the profile", async () => {
    const payload = mockPayload()

    const result = await updateMemberResearchInterests([" Code review ", "", "AI", "AI"])

    expect(result).toEqual({ ok: true })
    expect(payload.update).toHaveBeenCalledWith({
      collection: "members",
      id: 7,
      data: { researchInterests: ["Code review", "AI"] },
      user: member.user,
      overrideAccess: false,
    })
    expect(updateTag).toHaveBeenCalledWith(QueryKeys.MEMBERS.ID(7))
  })

  it("lets the member clear all their interests", async () => {
    const payload = mockPayload()

    const result = await updateMemberResearchInterests([])

    expect(result).toEqual({ ok: true })
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { researchInterests: [] } }),
    )
  })

  it("reports a form error and logs when the update fails", async () => {
    const payload = mockPayload({ update: vi.fn().mockRejectedValue(new Error("db down")) })

    const result = await updateMemberResearchInterests(["Code review"])

    expect(result).toEqual({
      formError: "Could not save your research interests. Try again.",
      ok: false,
    })
    expect(payload.logger.error).toHaveBeenCalled()
    expect(updateTag).not.toHaveBeenCalled()
  })
})
