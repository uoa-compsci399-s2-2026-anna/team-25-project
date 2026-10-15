import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { updateProposal } from "./updateProposal"

// A local stand-in so `instanceof` still discriminates: the action and this
// test both resolve to this same class. Declared via vi.hoisted because
// vi.mock's factory is hoisted above ordinary top-level declarations.
const { ValidationError } = vi.hoisted(() => {
  class ValidationError extends Error {
    data: { errors: { message: string; path: string }[] }
    constructor(errors: { message: string; path: string }[]) {
      super("Validation failed")
      this.data = { errors }
    }
  }
  return { ValidationError }
})

vi.mock("payload", () => ({ ValidationError }))
vi.mock("next/cache", () => ({ updateTag: vi.fn() }))
vi.mock("@/lib/payload/getPayloadClient", () => ({ getPayloadClient: vi.fn() }))
vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))

const member = { collection: "members" as const, user: { id: 7 } }

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

const SAVE_FAILED = "Could not save your changes. Try again."

describe("updateProposal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue(member as any)
  })

  describe("who can save", () => {
    it("refuses when nobody is signed in", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })
      const payload = mockPayload()

      const result = await updateProposal(4, { title: "New title" })

      expect(result).toEqual({ formError: "Sign in to edit this proposal.", ok: false })
      expect(payload.update).not.toHaveBeenCalled()
    })

    it("leaves the author check to Payload's access rules, as the signed-in user", async () => {
      const payload = mockPayload()

      await updateProposal(4, { title: "New title" })

      expect(payload.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: 4, overrideAccess: false, user: member.user }),
      )
    })

    it("refuses a member who isn't an author, without saying whether the proposal exists", async () => {
      const payload = mockPayload({
        update: vi.fn().mockRejectedValue(new Error("You are not allowed to perform this action.")),
      })

      const result = await updateProposal(4, { title: "New title" })

      expect(result).toEqual({ formError: SAVE_FAILED, ok: false })
      expect(payload.logger.error).toHaveBeenCalled()
      expect(updateTag).not.toHaveBeenCalled()
    })

    it("refuses an id that isn't a whole number", async () => {
      const payload = mockPayload()

      const result = await updateProposal(Number.NaN, { title: "New title" })

      expect(result).toEqual({ formError: SAVE_FAILED, ok: false })
      expect(payload.update).not.toHaveBeenCalled()
    })
  })

  describe("what gets saved", () => {
    it("saves only the fields sent, so the rest are kept", async () => {
      const payload = mockPayload()

      const result = await updateProposal(4, { title: "New title" })

      expect(result).toEqual({ ok: true })
      expect(payload.update.mock.calls[0]?.[0].data).toEqual({ title: "New title" })
    })

    it("drops fields an edit may not change", async () => {
      const payload = mockPayload()

      await updateProposal(4, {
        author: [99],
        institutions: [3],
        status: "closed",
        title: "New title",
      })

      expect(payload.update.mock.calls[0]?.[0].data).toEqual({ title: "New title" })
    })

    it("returns schema errors against their fields without saving", async () => {
      const payload = mockPayload()

      const result = await updateProposal(4, { title: "" })

      expect(result).toEqual({
        fieldErrors: { title: "Title is required" },
        formError: "Title is required",
        ok: false,
      })
      expect(payload.update).not.toHaveBeenCalled()
    })

    it("surfaces a Payload validation error, repeated as the form error", async () => {
      // e.g. the start year moved past the saved end year, which has no input on screen.
      const message = "End year cannot be before the start year."
      mockPayload({
        update: vi
          .fn()
          .mockRejectedValue(new ValidationError([{ message, path: "timeframe.endYear" }])),
      })

      const result = await updateProposal(4, {
        timeframe: { startPeriod: "sem1", startYear: 2030 },
      })

      expect(result).toEqual({
        fieldErrors: { "timeframe.endYear": message },
        formError: message,
        ok: false,
      })
    })

    it("expires the proposal's cache so the saved version shows straight away", async () => {
      mockPayload()

      await updateProposal(4, { title: "New title" })

      expect(updateTag).toHaveBeenCalledWith(QueryKeys.PROPOSALS.ID(4))
      expect(updateTag).toHaveBeenCalledWith(QueryKeys.PROPOSALS.ROOT)
    })
  })
})
