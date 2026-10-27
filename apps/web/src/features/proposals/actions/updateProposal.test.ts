import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { updateProposal } from "./updateProposal"

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

const SAVE_FAILED = "Could not save your changes. Try again."

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

      const result = await updateProposal(3, { title: "New title" })

      expect(result).toEqual({ formError: "Sign in to edit this proposal.", ok: false })
      expect(payload.update).not.toHaveBeenCalled()
    })

    it("leaves the author check to Payload's access rule", async () => {
      const payload = mockPayload()

      await updateProposal(3, { title: "New title" })

      expect(payload.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: 3, overrideAccess: false, user: member.user }),
      )
    })

    it.each([Number.NaN, 1.5])("refuses an id that isn't an integer (%s)", async (id) => {
      const payload = mockPayload()

      const result = await updateProposal(id, { title: "New title" })

      expect(result).toEqual({ formError: SAVE_FAILED, ok: false })
      expect(payload.update).not.toHaveBeenCalled()
    })

    it.each([
      ["Forbidden", Object.assign(new Error("Forbidden"), { status: 403 })],
      ["NotFound", Object.assign(new Error("Not Found"), { status: 404 })],
    ])(
      "gives one message for %s, so it doesn't reveal whether the proposal exists",
      async (_, error) => {
        const payload = mockPayload({ update: vi.fn().mockRejectedValue(error) })

        const result = await updateProposal(3, { title: "New title" })

        expect(result).toEqual({ formError: SAVE_FAILED, ok: false })
        expect(payload.logger.error).toHaveBeenCalled()
        expect(updateTag).not.toHaveBeenCalled()
      },
    )
  })

  describe("what is saved", () => {
    it("strips author, so an edit can't change who wrote the proposal", async () => {
      const payload = mockPayload()

      await updateProposal(3, { author: [99], title: "New title" })

      expect(payload.update.mock.calls[0]?.[0].data).toEqual({ title: "New title" })
    })

    it("sends only the given fields, so a left-out status isn't reset", async () => {
      const payload = mockPayload()

      await updateProposal(3, { summary: "New summary" })

      expect(payload.update.mock.calls[0]?.[0].data).toEqual({ summary: "New summary" })
    })

    it("clears an end left out of a sent timeframe", async () => {
      const payload = mockPayload()

      await updateProposal(3, { timeframe: { startPeriod: "sem1", startYear: 2027 } })

      expect(payload.update.mock.calls[0]?.[0].data).toEqual({
        timeframe: { endPeriod: null, endYear: null, startPeriod: "sem1", startYear: 2027 },
      })
    })

    it("keeps a sent end year and period", async () => {
      const payload = mockPayload()

      await updateProposal(3, {
        timeframe: { endPeriod: "late", endYear: 2028, startPeriod: "sem1", startYear: 2027 },
      })

      expect(payload.update.mock.calls[0]?.[0].data).toEqual({
        timeframe: { endPeriod: "late", endYear: 2028, startPeriod: "sem1", startYear: 2027 },
      })
    })

    it("refreshes the proposal and the list after a save", async () => {
      mockPayload()

      const result = await updateProposal(3, { title: "New title" })

      expect(result).toEqual({ ok: true })
      expect(updateTag).toHaveBeenCalledWith(QueryKeys.PROPOSALS.ID(3))
      expect(updateTag).toHaveBeenCalledWith(QueryKeys.PROPOSALS.ROOT)
    })
  })

  describe("errors", () => {
    it("repeats the first schema error as the form error and saves nothing", async () => {
      const payload = mockPayload()

      const result = await updateProposal(3, { title: "" })

      expect(result).toEqual({
        fieldErrors: { title: "Title is required" },
        formError: "Title is required",
        ok: false,
      })
      expect(payload.update).not.toHaveBeenCalled()
    })

    it("repeats a Payload field error as the form error", async () => {
      mockPayload({
        update: vi
          .fn()
          .mockRejectedValue(
            new ValidationError([
              { message: "End year cannot be before the start year.", path: "timeframe.endYear" },
            ]),
          ),
      })

      const result = await updateProposal(3, {
        timeframe: { startPeriod: "sem1", startYear: 2030 },
      })

      expect(result).toEqual({
        fieldErrors: { "timeframe.endYear": "End year cannot be before the start year." },
        formError: "End year cannot be before the start year.",
        ok: false,
      })
      expect(updateTag).not.toHaveBeenCalled()
    })

    it("falls back to the save-failed message for a Payload error with no field", async () => {
      mockPayload({ update: vi.fn().mockRejectedValue(new ValidationError([])) })

      const result = await updateProposal(3, { title: "New title" })

      expect(result).toEqual({ formError: SAVE_FAILED, ok: false })
    })
  })
})
