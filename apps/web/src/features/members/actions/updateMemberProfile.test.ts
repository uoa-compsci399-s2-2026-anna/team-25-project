import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { toProfileFormData } from "./profileFormData"
import { updateMemberProfile } from "./updateMemberProfile"

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
    delete: vi.fn().mockResolvedValue({}),
    logger: { error: vi.fn() },
    update: vi.fn().mockResolvedValue({}),
    ...overrides,
  }
  // biome-ignore lint/suspicious/noExplicitAny: minimal Payload mock, only the operations the action calls
  vi.mocked(getPayloadClient).mockResolvedValue(payload as any)
  return payload
}

const png = () => new File(["data"], "photo.png", { type: "image/png" })

describe("updateMemberProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue(member as any)
  })

  describe("who can save", () => {
    it("refuses when nobody is signed in", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })
      const payload = mockPayload()

      const result = await updateMemberProfile(toProfileFormData({ bio: "Hi" }))

      expect(result).toEqual({ formError: "Sign in as a member to edit your profile.", ok: false })
      expect(payload.update).not.toHaveBeenCalled()
    })

    it("refuses an admin, who has no member profile", async () => {
      // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
      vi.mocked(getCurrentUser).mockResolvedValue({ collection: "admin", user: { id: 1 } } as any)
      const payload = mockPayload()

      const result = await updateMemberProfile(toProfileFormData({ bio: "Hi" }))

      expect(result).toMatchObject({ ok: false })
      expect(payload.update).not.toHaveBeenCalled()
    })
  })

  describe("validation", () => {
    it("reports each invalid field and saves nothing", async () => {
      const payload = mockPayload()

      const result = await updateMemberProfile(
        toProfileFormData({ firstName: " ", position: "x".repeat(101) }),
      )

      expect(result).toEqual({
        fieldErrors: {
          firstName: "First name is required",
          position: "Keep your position under 100 characters",
        },
        formError: "First name is required",
        ok: false,
      })
      expect(payload.update).not.toHaveBeenCalled()
    })

    it("rejects profile data that isn't JSON", async () => {
      const payload = mockPayload()
      const formData = new FormData()
      formData.set("profile", "{not json")

      const result = await updateMemberProfile(formData)

      expect(result).toMatchObject({ ok: false })
      expect(payload.update).not.toHaveBeenCalled()
    })

    it.each([
      ["an SVG", new File(["<svg/>"], "logo.svg", { type: "image/svg+xml" }), "JPG, PNG"],
      [
        "a photo over 4 MB",
        Object.defineProperty(png(), "size", { value: 4 * 1024 * 1024 + 1 }),
        "4 MB",
      ],
    ])("rejects %s without uploading it", async (_, avatar, message) => {
      const payload = mockPayload()

      const result = await updateMemberProfile(toProfileFormData({ avatar }))

      expect(result).toMatchObject({
        ok: false,
        fieldErrors: { avatar: expect.stringContaining(message) },
      })
      expect(payload.create).not.toHaveBeenCalled()
      expect(payload.update).not.toHaveBeenCalled()
    })
  })

  describe("saving", () => {
    it("saves every text field in one update, cleaned up by the schema", async () => {
      const payload = mockPayload()

      const result = await updateMemberProfile(
        toProfileFormData({
          title: "dr",
          firstName: " Anna ",
          lastName: "Tui",
          position: "Lecturer",
          bio: "  Hello  ",
          researchInterests: ["AI", " ", "AI", "HCI"],
          avatar: null,
        }),
      )

      expect(result).toEqual({ ok: true })
      expect(payload.create).not.toHaveBeenCalled()
      expect(payload.update).toHaveBeenCalledTimes(1)
      expect(payload.update).toHaveBeenCalledWith({
        collection: "members",
        id: 7,
        data: {
          title: "dr",
          firstName: "Anna",
          lastName: "Tui",
          position: "Lecturer",
          bio: "Hello",
          researchInterests: ["AI", "HCI"],
        },
        user: member.user,
        overrideAccess: false,
      })
      expect(updateTag).toHaveBeenCalledWith(QueryKeys.MEMBERS.ID(7))
    })

    it("uploads a new photo and points the member at it in the same update", async () => {
      const payload = mockPayload()

      const result = await updateMemberProfile(toProfileFormData({ bio: "Hi", avatar: png() }))

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
      expect(payload.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { bio: "Hi", avatar: 55 } }),
      )
    })
  })

  describe("failures", () => {
    it("doesn't touch the member when the photo upload fails", async () => {
      const payload = mockPayload({ create: vi.fn().mockRejectedValue(new Error("S3 down")) })

      const result = await updateMemberProfile(toProfileFormData({ avatar: png() }))

      expect(result).toEqual({ formError: "Could not upload your photo. Try again.", ok: false })
      expect(payload.logger.error).toHaveBeenCalled()
      expect(payload.update).not.toHaveBeenCalled()
    })

    it("reports a form error, logs, and removes the orphaned photo when the update fails", async () => {
      const payload = mockPayload({ update: vi.fn().mockRejectedValue(new Error("db down")) })

      const result = await updateMemberProfile(toProfileFormData({ bio: "Hi", avatar: png() }))

      expect(result).toEqual({ formError: "Could not save your changes. Try again.", ok: false })
      expect(payload.logger.error).toHaveBeenCalled()
      expect(payload.delete).toHaveBeenCalledWith(
        expect.objectContaining({ collection: "media", id: 55 }),
      )
      expect(updateTag).not.toHaveBeenCalled()
    })
  })
})
