import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { updateResource } from "./updateResource"

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

describe("updateResource", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue(member as any)
  })

  describe("who can save", () => {
    it("refuses when nobody is signed in", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })
      const payload = mockPayload()

      const result = await updateResource(3, { title: "New title" })

      expect(result).toEqual({ formError: "Sign in to edit this resource.", ok: false })
      expect(payload.update).not.toHaveBeenCalled()
    })

    it("leaves the owner check to Payload's access rule", async () => {
      const payload = mockPayload()

      await updateResource(3, { title: "New title" })

      expect(payload.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: 3, overrideAccess: false, user: member.user }),
      )
    })

    it.each([Number.NaN, 1.5])("refuses an id that isn't an integer (%s)", async (id) => {
      const payload = mockPayload()

      const result = await updateResource(id, { title: "New title" })

      expect(result).toEqual({ formError: SAVE_FAILED, ok: false })
      expect(payload.update).not.toHaveBeenCalled()
    })

    it.each([
      ["Forbidden", Object.assign(new Error("Forbidden"), { status: 403 })],
      ["NotFound", Object.assign(new Error("Not Found"), { status: 404 })],
    ])(
      "gives one message for %s, so it doesn't reveal whether the resource exists",
      async (_, error) => {
        const payload = mockPayload({ update: vi.fn().mockRejectedValue(error) })

        const result = await updateResource(3, { title: "New title" })

        expect(result).toEqual({ formError: SAVE_FAILED, ok: false })
        expect(payload.logger.error).toHaveBeenCalled()
        expect(updateTag).not.toHaveBeenCalled()
      },
    )
  })

  describe("what is saved", () => {
    it("strips owner and attachments, which aren't edited in place", async () => {
      const payload = mockPayload()

      await updateResource(3, { attachments: [1], owner: 99, title: "New title" })

      expect(payload.update.mock.calls[0]?.[0].data).toEqual({ title: "New title" })
    })

    it.each([4, null])("saves the course as its id (%o)", async (course) => {
      const payload = mockPayload()

      await updateResource(3, { course })

      expect(payload.update.mock.calls[0]?.[0].data).toEqual({ course })
    })

    it("refreshes the resource and the list after a save", async () => {
      mockPayload()

      const result = await updateResource(3, { title: "New title" })

      expect(result).toEqual({ ok: true })
      expect(updateTag).toHaveBeenCalledWith(QueryKeys.RESOURCES.ID(3))
      expect(updateTag).toHaveBeenCalledWith(QueryKeys.RESOURCES.ROOT)
    })
  })

  describe("errors", () => {
    it("repeats the first schema error as the form error and saves nothing", async () => {
      const payload = mockPayload()

      const result = await updateResource(3, { title: "" })

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
          .mockRejectedValue(new ValidationError([{ message: "Too long.", path: "title" }])),
      })

      const result = await updateResource(3, { title: "New title" })

      expect(result).toEqual({
        fieldErrors: { title: "Too long." },
        formError: "Too long.",
        ok: false,
      })
      expect(updateTag).not.toHaveBeenCalled()
    })

    it("repeats Payload's refusal of a course the member can't edit", async () => {
      const message = "You can only link courses you can edit."
      mockPayload({
        update: vi.fn().mockRejectedValue(new ValidationError([{ message, path: "course" }])),
      })

      const result = await updateResource(3, { course: 5 })

      expect(result).toEqual({ fieldErrors: { course: message }, formError: message, ok: false })
    })

    it("falls back to the save-failed message for a Payload error with no field", async () => {
      mockPayload({ update: vi.fn().mockRejectedValue(new ValidationError([])) })

      const result = await updateResource(3, { title: "New title" })

      expect(result).toEqual({ formError: SAVE_FAILED, ok: false })
    })
  })
})
