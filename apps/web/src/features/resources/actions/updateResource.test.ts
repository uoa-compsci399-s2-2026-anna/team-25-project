import { QueryKeys } from "@repo/shared/constants/query-keys"
import { RESOURCE_ATTACHMENTS_MAX_BYTES } from "@repo/shared/constants/resource-attachments"
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

const UPDATE_FAILED = "Could not save this resource. Try again."

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
  keep = [] as number[],
  text = "Four-criterion rubric.",
  title = "Contribution rubric",
} = {}) => {
  const data = new FormData()
  data.set("title", title)
  data.set("description", JSON.stringify(description(text)))
  data.set("course", course)
  for (const file of attachments) data.append("attachments", file)
  for (const id of keep) data.append("keepAttachments", String(id))
  return data
}

const member = { collection: "members" as const, user: { id: 7 } }
const admin = { collection: "admin" as const, user: { id: 1 } }

// The resource as saved: owned by member 7, with two attachments.
const existing = {
  attachments: [
    { filesize: 1024, id: 21 },
    { filesize: 2048, id: 22 },
  ],
  id: 3,
  owner: { id: 7 },
}

const mockPayload = ({
  create = vi.fn(),
  findByID = vi.fn().mockResolvedValue(existing),
  update = vi.fn().mockResolvedValue({ id: 3 }),
} = {}) => {
  const payload = {
    create,
    db: {
      beginTransaction: vi.fn().mockResolvedValue(1),
      commitTransaction: vi.fn().mockResolvedValue(undefined),
      rollbackTransaction: vi.fn().mockResolvedValue(undefined),
    },
    findByID,
    logger: { error: vi.fn() },
    update,
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

  it("saves the fields, keeps the files asked for and links the new ones, as the owner", async () => {
    const create = vi.fn().mockResolvedValueOnce({ id: 31 })
    const payload = mockPayload({ create })

    await expect(
      updateResource(3, form({ attachments: [pdf("notes.pdf")], keep: [22] })),
    ).resolves.toEqual({ ok: true })

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "resourceAttachments",
        file: expect.objectContaining({ name: "notes.pdf" }),
        overrideAccess: false,
        req: { transactionID: 1 },
        user: member.user,
      }),
    )
    expect(payload.update).toHaveBeenCalledWith({
      collection: "resources",
      data: {
        attachments: [22, 31],
        course: 4,
        description: description("Four-criterion rubric."),
        title: "Contribution rubric",
      },
      id: 3,
      overrideAccess: false,
      req: { transactionID: 1 },
      user: member.user,
    })
    expect(payload.db.commitTransaction).toHaveBeenCalledWith(1)
    expect(updateTag).toHaveBeenCalledWith(QueryKeys.RESOURCES.ROOT)
    expect(updateTag).toHaveBeenCalledWith(QueryKeys.RESOURCES.ID(3))
  })

  it("unlinks every file when none are kept, and clears the course", async () => {
    const payload = mockPayload()

    await expect(updateResource(3, form({ course: "" }))).resolves.toEqual({ ok: true })

    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ attachments: [], course: null }) }),
    )
  })

  it("ignores kept ids the resource doesn't link, so no one else's file can be attached", async () => {
    const payload = mockPayload()

    await updateResource(3, form({ keep: [21, 99] }))

    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ attachments: [21] }) }),
    )
  })

  it("lets an admin edit a resource they don't own", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue(admin as any)
    const payload = mockPayload()

    await expect(updateResource(3, form())).resolves.toEqual({ ok: true })
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({ user: admin.user }))
  })

  it("refuses a member who doesn't own the resource before uploading anything", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue({ ...member, user: { id: 8 } } as any)
    const payload = mockPayload()

    await expect(updateResource(3, form({ attachments: [pdf("notes.pdf")] }))).resolves.toEqual({
      formError: UPDATE_FAILED,
      ok: false,
    })
    expect(payload.create).not.toHaveBeenCalled()
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("gives the same message for a resource that doesn't exist", async () => {
    const payload = mockPayload({ findByID: vi.fn().mockResolvedValue(null) })

    await expect(updateResource(3, form())).resolves.toEqual({
      formError: UPDATE_FAILED,
      ok: false,
    })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it.each([Number.NaN, 1.5])("refuses an id that isn't an integer (%s)", async (id) => {
    const payload = mockPayload()

    await expect(updateResource(id, form())).resolves.toEqual({
      formError: UPDATE_FAILED,
      ok: false,
    })
    expect(payload.findByID).not.toHaveBeenCalled()
  })

  it("refuses when nobody is signed in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })
    const payload = mockPayload()

    await expect(updateResource(3, form())).resolves.toEqual({
      formError: "Sign in to edit this resource.",
      ok: false,
    })
    expect(payload.findByID).not.toHaveBeenCalled()
  })

  it("returns the field errors for a blank title without loading anything", async () => {
    const payload = mockPayload()

    await expect(updateResource(3, form({ title: "  " }))).resolves.toEqual({
      fieldErrors: { title: "Title is required" },
      ok: false,
    })
    expect(payload.findByID).not.toHaveBeenCalled()
  })

  it("counts the kept files toward the size limit", async () => {
    const big = { filesize: RESOURCE_ATTACHMENTS_MAX_BYTES, id: 21 }
    const payload = mockPayload({
      findByID: vi.fn().mockResolvedValue({ ...existing, attachments: [big] }),
    })

    const result = await updateResource(3, form({ attachments: [pdf("notes.pdf")], keep: [21] }))

    expect(result).toEqual({
      fieldErrors: { attachments: expect.stringMatching(/MB or smaller in total/) },
      ok: false,
    })
    expect(payload.db.beginTransaction).not.toHaveBeenCalled()
  })

  it("rolls back and names the file Payload refuses", async () => {
    const create = vi
      .fn()
      .mockRejectedValue(new ValidationError([{ message: "Invalid PDF file.", path: "file" }]))
    const payload = mockPayload({ create })

    await expect(updateResource(3, form({ attachments: [pdf("fake.pdf")] }))).resolves.toEqual({
      fieldErrors: { attachments: "fake.pdf: Invalid PDF file." },
      ok: false,
    })
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith(1)
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("rolls back and shows the field error when the update fails validation", async () => {
    const update = vi
      .fn()
      .mockRejectedValue(
        new ValidationError([
          { message: "You can only link courses you can edit.", path: "course" },
        ]),
      )
    const payload = mockPayload({ update })

    await expect(updateResource(3, form())).resolves.toEqual({
      fieldErrors: { course: "You can only link courses you can edit." },
      ok: false,
    })
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith(1)
    expect(updateTag).not.toHaveBeenCalled()
  })

  it("rolls back, logs and gives one message for anything else, e.g. Forbidden", async () => {
    const update = vi.fn().mockRejectedValue(Object.assign(new Error("Forbidden"), { status: 403 }))
    const payload = mockPayload({ update })

    await expect(updateResource(3, form())).resolves.toEqual({
      formError: UPDATE_FAILED,
      ok: false,
    })
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith(1)
    expect(payload.logger.error).toHaveBeenCalled()
  })

  it("still succeeds when the cache update fails after the save", async () => {
    const payload = mockPayload()
    vi.mocked(updateTag).mockImplementationOnce(() => {
      throw new Error("cache down")
    })

    await expect(updateResource(3, form())).resolves.toEqual({ ok: true })
    expect(payload.logger.error).toHaveBeenCalled()
  })
})
