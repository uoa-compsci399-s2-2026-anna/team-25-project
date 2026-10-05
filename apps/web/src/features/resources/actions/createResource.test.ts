import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { createResource } from "./createResource"

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

const description = (text: string) => ({
  root: {
    type: "root",
    children: [
      { type: "paragraph", version: 1, children: text ? [{ type: "text", version: 1, text }] : [] },
    ],
    direction: null,
    format: "",
    indent: 0,
    version: 1,
  },
})

const pdf = (name: string) => new File(["%PDF-1.4"], name, { type: "application/pdf" })

const form = ({
  attachments = [] as File[],
  course = "4",
  text = "Four-criterion rubric.",
  title = "Contribution rubric",
} = {}) => {
  const data = new FormData()
  data.set("title", title)
  data.set("description", JSON.stringify(description(text)))
  data.set("course", course)
  for (const file of attachments) data.append("attachments", file)
  return data
}

const member = { collection: "members" as const, user: { id: 7 } }

const mockPayload = (create = vi.fn()) => {
  const payload = {
    create,
    db: {
      beginTransaction: vi.fn().mockResolvedValue(1),
      commitTransaction: vi.fn().mockResolvedValue(undefined),
      rollbackTransaction: vi.fn().mockResolvedValue(undefined),
    },
    logger: { error: vi.fn() },
  }
  // biome-ignore lint/suspicious/noExplicitAny: minimal Payload mock, only the operations the action calls
  vi.mocked(getPayloadClient).mockResolvedValue(payload as any)
  return payload
}

describe("createResource", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue(member as any)
  })

  it("uploads the attachments and creates the resource that links them, as the member", async () => {
    const create = vi
      .fn()
      .mockResolvedValueOnce({ id: 31 })
      .mockResolvedValueOnce({ id: 32 })
      .mockResolvedValueOnce({ id: 9 })
    const payload = mockPayload(create)

    await expect(
      createResource(form({ attachments: [pdf("rubric.pdf"), pdf("notes.pdf")] })),
    ).resolves.toEqual({ ok: true })

    expect(create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        collection: "resourceAttachments",
        file: expect.objectContaining({ mimetype: "application/pdf", name: "rubric.pdf" }),
        overrideAccess: false,
        req: { transactionID: 1 },
        user: member.user,
      }),
    )
    expect(create).toHaveBeenLastCalledWith({
      collection: "resources",
      data: {
        attachments: [31, 32],
        course: 4,
        description: description("Four-criterion rubric."),
        owner: 7,
        title: "Contribution rubric",
      },
      overrideAccess: false,
      req: { transactionID: 1 },
      user: member.user,
    })
    expect(payload.db.commitTransaction).toHaveBeenCalledWith(1)
    expect(updateTag).toHaveBeenCalledWith(QueryKeys.RESOURCES.ROOT)
  })

  it("creates a resource with no course or attachments", async () => {
    const create = vi.fn().mockResolvedValue({ id: 9 })
    mockPayload(create)

    await expect(createResource(form({ course: "" }))).resolves.toEqual({ ok: true })
    expect(create).toHaveBeenCalledOnce()
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ attachments: [], course: null }) }),
    )
  })

  it("returns field errors for an invalid form without touching the database", async () => {
    const payload = mockPayload()

    await expect(createResource(form({ text: "", title: " " }))).resolves.toEqual({
      fieldErrors: { description: "Description is required", title: "Title is required" },
      ok: false,
    })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it("refuses unsupported attachments before uploading anything", async () => {
    const payload = mockPayload()
    const page = new File(["<script>"], "page.html", { type: "text/html" })

    const result = await createResource(form({ attachments: [page] }))

    expect(result).toMatchObject({
      fieldErrors: {
        attachments: expect.stringMatching(/^page\.html isn't a supported file type/),
      },
      ok: false,
    })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it.each([
    ["a guest", { collection: null, user: null }, "Sign in to share a resource."],
    [
      "an admin",
      { collection: "admin", user: { id: 1 } },
      "Only members can share a resource - admins manage resources, not share them.",
    ],
  ])("refuses %s", async (_label, currentUser, formError) => {
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue(currentUser as any)
    const payload = mockPayload()

    await expect(createResource(form())).resolves.toEqual({ formError, ok: false })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it("names the file Payload rejects and rolls back", async () => {
    const create = vi
      .fn()
      .mockRejectedValueOnce(new ValidationError([{ message: "Invalid PDF file.", path: "file" }]))
    const payload = mockPayload(create)

    await expect(createResource(form({ attachments: [pdf("fake.pdf")] }))).resolves.toEqual({
      fieldErrors: { attachments: "fake.pdf: Invalid PDF file." },
      ok: false,
    })
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith(1)
    expect(updateTag).not.toHaveBeenCalled()
  })

  it("puts a resource validation error on its field and rolls back", async () => {
    const create = vi
      .fn()
      .mockRejectedValueOnce(
        new ValidationError([
          { message: "You can only link courses you can edit.", path: "course" },
        ]),
      )
    const payload = mockPayload(create)

    await expect(createResource(form())).resolves.toEqual({
      fieldErrors: { course: "You can only link courses you can edit." },
      ok: false,
    })
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith(1)
  })

  it("logs an unexpected failure and shows a general message", async () => {
    const payload = mockPayload(vi.fn().mockRejectedValueOnce(new Error("connection lost")))

    await expect(createResource(form())).resolves.toEqual({
      formError: "Could not share this resource. Try again.",
      ok: false,
    })
    expect(payload.logger.error).toHaveBeenCalled()
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith(1)
  })
})
