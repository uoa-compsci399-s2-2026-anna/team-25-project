import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { createPublication } from "./createPublication"

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
  coAuthors: [{ name: "Ben Lee" }],
  year: 2025,
  month: "",
  doi: "",
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

const mockPayload = (create = vi.fn().mockResolvedValue({ id: 1 })) => {
  const payload = { create, logger: { error: vi.fn() } }
  // biome-ignore lint/suspicious/noExplicitAny: minimal Payload mock, only the operations the action calls
  vi.mocked(getPayloadClient).mockResolvedValue(payload as any)
  return payload
}

describe("createPublication", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue(member as any)
  })

  it("returns field errors for invalid input without creating anything", async () => {
    const payload = mockPayload()

    const result = await createPublication({ ...input, title: "", year: 99 })

    expect(result).toEqual({
      fieldErrors: { title: "Title is required", year: expect.any(String) },
      ok: false,
    })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it("rejects a guest", async () => {
    const payload = mockPayload()
    // biome-ignore lint/suspicious/noExplicitAny: guest result shape
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null } as any)

    expect(await createPublication(input)).toEqual({
      formError: "Sign in as a member to add a publication.",
      ok: false,
    })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it("rejects an admin", async () => {
    mockPayload()
    // biome-ignore lint/suspicious/noExplicitAny: admin result shape
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: "admin", user: { id: 1 } } as any)

    expect(await createPublication(input)).toMatchObject({ ok: false })
  })

  it("adds the signed-in member as the linked first author and drops blank fields", async () => {
    const payload = mockPayload()

    expect(await createPublication(input)).toEqual({ ok: true })
    expect(payload.create).toHaveBeenCalledWith({
      collection: "publications",
      data: {
        authors: [{ member: 7, name: "Anna Smith" }, { name: "Ben Lee" }],
        title: "Teamwork in capstone courses",
        type: "article",
        year: 2025,
      },
      overrideAccess: false,
      user: member.user,
    })
    expect(updateTag).toHaveBeenCalledWith(QueryKeys.PUBLICATIONS.ROOT)
  })

  it("converts month and splits tags", async () => {
    const payload = mockPayload()

    await createPublication({
      ...input,
      doi: " 10.1145/1 ",
      month: "3",
      tags: "Teamwork, Assessment,, Teamwork ",
    })

    expect(payload.create.mock.calls[0]?.[0].data).toMatchObject({
      doi: "10.1145/1",
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

    expect(await createPublication(input)).toEqual({
      fieldErrors: { doi: "Value must be unique" },
      ok: false,
    })
    expect(updateTag).not.toHaveBeenCalled()
  })

  it("falls back to a form error for a path-less validation error", async () => {
    mockPayload(vi.fn().mockRejectedValue(new ValidationError([{ message: "Bad" }])))

    expect(await createPublication(input)).toEqual({
      formError: "Could not add this publication. Try again.",
      ok: false,
    })
  })

  it("logs and returns a form error for an unknown failure", async () => {
    const payload = mockPayload(vi.fn().mockRejectedValue(new Error("boom")))

    expect(await createPublication(input)).toEqual({
      formError: "Could not add this publication. Try again.",
      ok: false,
    })
    expect(payload.logger.error).toHaveBeenCalled()
  })
})
