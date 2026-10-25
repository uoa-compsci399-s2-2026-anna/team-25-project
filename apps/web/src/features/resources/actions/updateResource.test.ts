import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
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
    create: vi.fn(),
    db: {
      beginTransaction: vi.fn().mockResolvedValue(1),
      commitTransaction: vi.fn().mockResolvedValue(undefined),
      rollbackTransaction: vi.fn().mockResolvedValue(undefined),
    },
    findByID: vi.fn().mockResolvedValue({ attachments: [11, 12] }),
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
    it("strips the owner, which isn't edited in place", async () => {
      const payload = mockPayload()

      await updateResource(3, { owner: 99, title: "New title" })

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

  describe("attachments", () => {
    const pdf = (name: string) => new File(["%PDF-1.4"], name, { type: "application/pdf" })

    it("saves the kept files and the new uploads, in one transaction", async () => {
      const payload = mockPayload({ create: vi.fn().mockResolvedValueOnce({ id: 31 }) })

      const result = await updateResource(3, {
        attachments: { add: [pdf("rubric.pdf")], keep: [12] },
      })

      expect(result).toEqual({ ok: true })
      expect(payload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: Slugs.Collections.RESOURCE_ATTACHMENTS,
          overrideAccess: false,
          req: { transactionID: 1 },
          user: member.user,
        }),
      )
      expect(payload.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { attachments: [12, 31] }, req: { transactionID: 1 } }),
      )
      expect(payload.db.commitTransaction).toHaveBeenCalledWith(1)
    })

    it("drops kept ids that aren't linked to the resource", async () => {
      const payload = mockPayload()

      await updateResource(3, { attachments: { add: [], keep: [11, 11, 99] } })

      expect(payload.findByID).toHaveBeenCalledWith(
        expect.objectContaining({ id: 3, overrideAccess: false, user: member.user }),
      )
      expect(payload.update.mock.calls[0]?.[0].data).toEqual({ attachments: [11] })
    })

    it("leaves attachments alone, without a transaction, when they aren't edited", async () => {
      const payload = mockPayload()

      await updateResource(3, { title: "New title" })

      expect(payload.db.beginTransaction).not.toHaveBeenCalled()
      expect(payload.findByID).not.toHaveBeenCalled()
      expect(payload.update.mock.calls[0]?.[0].data).toEqual({ title: "New title" })
    })

    it("names a file Payload refuses and rolls back", async () => {
      const payload = mockPayload({
        create: vi
          .fn()
          .mockRejectedValue(new ValidationError([{ message: "Not a PDF.", path: "file" }])),
      })

      const result = await updateResource(3, { attachments: { add: [pdf("fake.pdf")], keep: [] } })

      expect(result).toEqual({
        fieldErrors: { attachments: "fake.pdf: Not a PDF." },
        formError: "fake.pdf: Not a PDF.",
        ok: false,
      })
      expect(payload.db.rollbackTransaction).toHaveBeenCalledWith(1)
      expect(payload.update).not.toHaveBeenCalled()
    })

    it("rolls back when the save fails after uploading", async () => {
      const payload = mockPayload({
        create: vi.fn().mockResolvedValue({ id: 31 }),
        update: vi.fn().mockRejectedValue(Object.assign(new Error("Forbidden"), { status: 403 })),
      })

      const result = await updateResource(3, {
        attachments: { add: [pdf("rubric.pdf")], keep: [] },
      })

      expect(result).toEqual({ formError: SAVE_FAILED, ok: false })
      expect(payload.db.rollbackTransaction).toHaveBeenCalledWith(1)
      expect(payload.db.commitTransaction).not.toHaveBeenCalled()
    })

    it("refuses more files than the cap, counting the kept ones, before uploading", async () => {
      const payload = mockPayload()
      const keep = Array.from({ length: 10 }, (_, i) => i + 1)

      const result = await updateResource(3, { attachments: { add: [pdf("one.pdf")], keep } })

      expect(result).toMatchObject({ formError: "Attach at most 10 files.", ok: false })
      expect(payload.create).not.toHaveBeenCalled()
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
