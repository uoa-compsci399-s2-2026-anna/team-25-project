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
  authors: [
    { id: "1", kind: "self" },
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

  it("returns a form error for input with no field to show on", async () => {
    const payload = mockPayload()

    expect(await createPublication("not a form")).toEqual({
      formError: "Could not add this publication. Check the form and try again.",
      ok: false,
    })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it("rejects a non-web URL", async () => {
    const payload = mockPayload()

    expect(await createPublication({ ...input, url: "javascript:alert(1)" })).toEqual({
      fieldErrors: { url: "Enter a full URL that starts with https:// or http://" },
      ok: false,
    })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it.each([
    ["a guest", { collection: null, user: null }, "Sign in to add a publication."],
    [
      "an admin",
      { collection: "admin", user: { id: 1 } },
      "Only members can add a publication - admins manage publications, not add them.",
    ],
  ])("refuses %s", async (_label, currentUser, formError) => {
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue(currentUser as any)
    const payload = mockPayload()

    await expect(createPublication(input)).resolves.toEqual({ formError, ok: false })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it("ignores a member id sent on an external author", async () => {
    const payload = mockPayload()

    await createPublication({
      ...input,
      authors: [
        { id: "1", kind: "self" },
        { id: "2", kind: "external", member: 99, name: "Ben Lee" },
      ],
    })

    expect(payload.create.mock.calls[0]?.[0].data.authors).toEqual([
      { member: 7, name: "Anna Smith" },
      { name: "Ben Lee" },
    ])
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
        doi: "10.1145/3313831.3376518",
        year: 2025,
      },
      overrideAccess: false,
      user: member.user,
    })
    expect(updateTag).toHaveBeenCalledWith(QueryKeys.PUBLICATIONS.ROOT)
  })

  it("links co-authors who are members", async () => {
    const payload = mockPayload()

    await createPublication({
      ...input,
      authors: [
        { id: "1", kind: "self" },
        { id: "2", kind: "member", memberId: 12, name: "B. Lee" },
        { id: "3", kind: "external", name: "Cara Ngata" },
      ],
    })

    expect(payload.create.mock.calls[0]?.[0].data.authors).toEqual([
      { member: 7, name: "Anna Smith" },
      { member: 12, name: "B. Lee" },
      { name: "Cara Ngata" },
    ])
  })

  it("rejects the signed-in member linked as a co-author", async () => {
    const payload = mockPayload()

    expect(
      await createPublication({
        ...input,
        authors: [
          { id: "1", kind: "self" },
          { id: "2", kind: "member", memberId: 7, name: "Anna Smith" },
        ],
      }),
    ).toEqual({
      fieldErrors: { "authors.1.member": "You are already in the author list." },
      ok: false,
    })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it("keeps the signed-in member at the position they chose", async () => {
    const payload = mockPayload()

    await createPublication({
      ...input,
      authors: [
        { id: "3", kind: "external", name: "Ben Lee" },
        { id: "4", kind: "self" },
        { id: "5", kind: "external", name: "Cara Ngata" },
      ],
    })

    expect(payload.create.mock.calls[0]?.[0].data.authors).toEqual([
      { name: "Ben Lee" },
      { member: 7, name: "Anna Smith" },
      { name: "Cara Ngata" },
    ])
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
    expect(updateTag).not.toHaveBeenCalled()
  })

  it("still succeeds when the cache update fails after the save", async () => {
    const payload = mockPayload()
    vi.mocked(updateTag).mockImplementationOnce(() => {
      throw new Error("cache down")
    })

    expect(await createPublication(input)).toEqual({ ok: true })
    expect(payload.logger.error).toHaveBeenCalled()
  })
})
