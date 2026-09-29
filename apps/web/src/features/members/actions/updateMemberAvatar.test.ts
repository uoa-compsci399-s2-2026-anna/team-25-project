import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { updateMemberAvatar } from "./updateMemberAvatar"

vi.mock("next/cache", () => ({ updateTag: vi.fn() }))
vi.mock("@/lib/payload/getPayloadClient", () => ({ getPayloadClient: vi.fn() }))
vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))

const member = {
  collection: "members" as const,
  user: { firstName: "Anna", id: 7, lastName: "Tui" },
}

const mockPayload = (overrides: Record<string, unknown> = {}) => {
  const payload = {
    create: vi.fn().mockResolvedValue({ id: 55 }),
    logger: { error: vi.fn() },
    update: vi.fn().mockResolvedValue({}),
    ...overrides,
  }
  // biome-ignore lint/suspicious/noExplicitAny: minimal Payload mock, only the operations the action calls
  vi.mocked(getPayloadClient).mockResolvedValue(payload as any)
  return payload
}

const withAvatar = (file: File) => {
  const formData = new FormData()
  formData.set("avatar", file)
  return formData
}

const png = () => new File(["data"], "photo.png", { type: "image/png" })

describe("updateMemberAvatar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue(member as any)
  })

  it("refuses when nobody is signed in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })
    const payload = mockPayload()

    const result = await updateMemberAvatar(withAvatar(png()))

    expect(result).toEqual({ formError: "Sign in as a member to change your photo.", ok: false })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it("asks for a photo when none was sent", async () => {
    const payload = mockPayload()

    const result = await updateMemberAvatar(new FormData())

    expect(result).toEqual({ formError: "Choose a photo to upload.", ok: false })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it("rejects file types Media doesn't allow, such as SVG", async () => {
    const payload = mockPayload()

    const result = await updateMemberAvatar(
      withAvatar(new File(["<svg/>"], "logo.svg", { type: "image/svg+xml" })),
    )

    expect(result).toEqual({ formError: "Please upload a JPG, PNG, GIF or WEBP image.", ok: false })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it("rejects a photo over 4 MB", async () => {
    const payload = mockPayload()
    const big = png()
    Object.defineProperty(big, "size", { value: 4 * 1024 * 1024 + 1 })

    const result = await updateMemberAvatar(withAvatar(big))

    expect(result).toEqual({ formError: "Your photo must be 4 MB or smaller.", ok: false })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it("doesn't touch the member when the upload itself fails", async () => {
    const payload = mockPayload({ create: vi.fn().mockRejectedValue(new Error("S3 down")) })

    const result = await updateMemberAvatar(withAvatar(png()))

    expect(result).toEqual({ formError: "Could not upload your photo. Try again.", ok: false })
    expect(payload.logger.error).toHaveBeenCalled()
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("uploads the photo, sets it as the member's avatar and refreshes their profile", async () => {
    const payload = mockPayload()

    const result = await updateMemberAvatar(withAvatar(png()))

    expect(result).toEqual({ ok: true })
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "media",
        data: { alt: "Anna Tui" },
        file: expect.objectContaining({ mimetype: "image/png", name: "photo.png" }),
        overrideAccess: false,
        user: member.user,
      }),
    )
    expect(payload.update).toHaveBeenCalledWith({
      collection: "members",
      id: 7,
      data: { avatar: 55 },
      user: member.user,
      overrideAccess: false,
    })
    expect(updateTag).toHaveBeenCalledWith(QueryKeys.MEMBERS.ID(7))
  })

  it("reports a form error when saving the avatar onto the member fails", async () => {
    const payload = mockPayload({ update: vi.fn().mockRejectedValue(new Error("db down")) })

    const result = await updateMemberAvatar(withAvatar(png()))

    expect(result).toEqual({ formError: "Could not save your photo. Try again.", ok: false })
    expect(payload.logger.error).toHaveBeenCalled()
    expect(updateTag).not.toHaveBeenCalled()
  })
})
