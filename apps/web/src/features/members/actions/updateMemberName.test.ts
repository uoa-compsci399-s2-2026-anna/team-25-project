import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { updateMemberName } from "./updateMemberName"

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

describe("updateMemberName", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue(member as any)
  })

  it("rejects a title that isn't one of the approved titles", async () => {
    const payload = mockPayload()

    const result = await updateMemberName({ title: "king", firstName: "Anna", lastName: "Tui" })

    expect(result).toMatchObject({ ok: false })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("requires a first name", async () => {
    const payload = mockPayload()

    const result = await updateMemberName({ title: null, firstName: "   ", lastName: "Tui" })

    expect(result).toEqual({ formError: "First name is required", ok: false })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("requires a surname", async () => {
    const payload = mockPayload()

    const result = await updateMemberName({ title: null, firstName: "Anna", lastName: "" })

    expect(result).toEqual({ formError: "Surname is required", ok: false })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("refuses when nobody is signed in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })
    const payload = mockPayload()

    const result = await updateMemberName({ title: null, firstName: "Anna", lastName: "Tui" })

    expect(result).toEqual({ formError: "Sign in as a member to edit your name.", ok: false })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("saves an approved title and the trimmed names, then refreshes the profile", async () => {
    const payload = mockPayload()

    const result = await updateMemberName({ title: "prof", firstName: " Ana ", lastName: "Tui " })

    expect(result).toEqual({ ok: true })
    expect(payload.update).toHaveBeenCalledWith({
      collection: "members",
      id: 7,
      data: { title: "prof", firstName: "Ana", lastName: "Tui" },
      user: member.user,
      overrideAccess: false,
    })
    expect(updateTag).toHaveBeenCalledWith(QueryKeys.MEMBERS.ID(7))
  })

  it("lets the member clear their title", async () => {
    const payload = mockPayload()

    const result = await updateMemberName({ title: null, firstName: "Anna", lastName: "Tui" })

    expect(result).toEqual({ ok: true })
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { title: null, firstName: "Anna", lastName: "Tui" } }),
    )
  })

  it("reports a form error and logs when the update fails", async () => {
    const payload = mockPayload({ update: vi.fn().mockRejectedValue(new Error("db down")) })

    const result = await updateMemberName({ title: null, firstName: "Anna", lastName: "Tui" })

    expect(result).toEqual({ formError: "Could not save your name. Try again.", ok: false })
    expect(payload.logger.error).toHaveBeenCalled()
    expect(updateTag).not.toHaveBeenCalled()
  })
})
