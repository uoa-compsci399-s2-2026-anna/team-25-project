import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { updatePublication } from "./updatePublication"

const { ValidationError } = vi.hoisted(() => {
  class ValidationError extends Error {
    data: { errors: { message: string; path?: string }[] }
    constructor(errors: { message: string; path?: string }[]) {
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

const input = {
  type: "article",
  title: "Teamwork in capstone courses",
  authors: [
    { id: "1", kind: "member", memberId: 7, name: "Anna Smith" },
    { id: "2", kind: "external", name: "Ben Lee" },
  ],
  year: 2025,
  month: "",
  doi: "10.1145/3313831.3376518",
  url: "",
  venue: "",
  volume: "",
  issue: "",
  pages: "",
  publisher: "",
  citationKey: "",
  abstract: "",
  tags: "",
}

const member = {
  collection: "members" as const,
  user: { firstName: "Anna", id: 7, lastName: "Smith" },
}

const mockPayload = (update = vi.fn().mockResolvedValue({ id: 1 })) => {
  const payload = { logger: { error: vi.fn() }, update }
  // biome-ignore lint/suspicious/noExplicitAny: minimal Payload mock, only the operations the action calls
  vi.mocked(getPayloadClient).mockResolvedValue(payload as any)
  return payload
}

describe("updatePublication", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue(member as any)
  })

  it.each([Number.NaN, 1.5])("refuses an id that isn't an integer (%s)", async (id) => {
    const payload = mockPayload()

    const result = await updatePublication(id, input)

    expect(result).toEqual({
      formError: "Could not save this publication. Try again.",
      ok: false,
    })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("returns field errors for invalid input without saving anything", async () => {
    const payload = mockPayload()

    const result = await updatePublication(3, { ...input, title: "", year: 99 })

    expect(result).toEqual({
      fieldErrors: { title: "Title is required", year: expect.any(String) },
      ok: false,
    })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("returns a form error for input with no field to show on", async () => {
    const payload = mockPayload()

    expect(await updatePublication(3, "not a form")).toEqual({
      formError: "Could not save this publication. Check the form and try again.",
      ok: false,
    })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("rejects a self-kind author - editing has no self row", async () => {
    const payload = mockPayload()

    const result = await updatePublication(3, {
      ...input,
      authors: [{ id: "1", kind: "self", name: "" }],
    })

    expect(result.ok).toBe(false)
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("refuses when nobody is signed in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })
    const payload = mockPayload()

    const result = await updatePublication(3, input)

    expect(result).toEqual({ formError: "Sign in to edit this publication.", ok: false })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("leaves the author/admin check to Payload's access rule", async () => {
    const payload = mockPayload()

    await updatePublication(3, input)

    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 3, overrideAccess: false, user: member.user }),
    )
  })

  it("sends linked and external authors, and clears blank fields with null", async () => {
    const payload = mockPayload()

    expect(await updatePublication(3, input)).toEqual({ ok: true })
    expect(payload.update).toHaveBeenCalledWith({
      collection: "publications",
      id: 3,
      data: {
        abstract: null,
        authors: [{ member: 7, name: "Anna Smith" }, { name: "Ben Lee" }],
        citationKey: null,
        doi: "10.1145/3313831.3376518",
        issue: null,
        month: null,
        pages: null,
        publisher: null,
        tags: [],
        title: "Teamwork in capstone courses",
        type: "article",
        url: null,
        venue: null,
        volume: null,
        year: 2025,
      },
      overrideAccess: false,
      user: member.user,
    })
    expect(updateTag).toHaveBeenCalledWith(QueryKeys.PUBLICATIONS.ROOT)
  })

  // Payload skips an undefined field on update, so undefined would leave the old value in place.
  it("sends null, not undefined, for a field the editor emptied", async () => {
    const payload = mockPayload()

    await updatePublication(3, { ...input, venue: "   ", url: "https://example.com/paper" })

    expect(payload.update.mock.calls[0]?.[0].data).toMatchObject({ tags: [], venue: null })
  })

  it("converts month and splits tags", async () => {
    const payload = mockPayload()

    await updatePublication(3, { ...input, month: "3", tags: "Teamwork, Assessment,, Teamwork " })

    expect(payload.update.mock.calls[0]?.[0].data).toMatchObject({
      month: 3,
      tags: ["Teamwork", "Assessment"],
    })
  })

  it("maps Payload validation errors onto fields", async () => {
    mockPayload(
      vi
        .fn()
        .mockRejectedValue(new ValidationError([{ message: "Value must be unique", path: "doi" }])),
    )

    expect(await updatePublication(3, input)).toEqual({
      fieldErrors: { doi: "Value must be unique" },
      ok: false,
    })
    expect(updateTag).not.toHaveBeenCalled()
  })

  it.each([
    ["Forbidden", Object.assign(new Error("Forbidden"), { status: 403 })],
    ["NotFound", Object.assign(new Error("Not Found"), { status: 404 })],
  ])(
    "gives one message for %s, so it doesn't reveal whether the publication exists",
    async (_, error) => {
      const payload = mockPayload(vi.fn().mockRejectedValue(error))

      const result = await updatePublication(3, input)

      expect(result).toEqual({
        formError: "Could not save this publication. Try again.",
        ok: false,
      })
      expect(payload.logger.error).toHaveBeenCalled()
      expect(updateTag).not.toHaveBeenCalled()
    },
  )

  it("still succeeds when the cache update fails after the save", async () => {
    const payload = mockPayload()
    vi.mocked(updateTag).mockImplementationOnce(() => {
      throw new Error("cache down")
    })

    expect(await updatePublication(3, input)).toEqual({ ok: true })
    expect(payload.logger.error).toHaveBeenCalled()
  })
})
