import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { createOffering } from "./createOffering"

const { APIError, ValidationError } = vi.hoisted(() => {
  class ValidationError extends Error {
    data: { errors: { message: string; path: string }[] }
    constructor(errors: { message: string; path: string }[]) {
      super("Validation failed")
      this.data = { errors }
    }
  }
  class APIError extends Error {}
  return { APIError, ValidationError }
})

vi.mock("payload", () => ({ APIError, ValidationError }))
vi.mock("next/cache", () => ({ updateTag: vi.fn() }))
vi.mock("@/lib/payload/getPayloadClient", () => ({ getPayloadClient: vi.fn() }))
vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))

const richText = (text: string) => ({
  root: {
    type: "root",
    children: [{ type: "paragraph", version: 1, children: [{ type: "text", version: 1, text }] }],
    direction: null,
    format: "" as const,
    indent: 0,
    version: 1,
  },
})

const member = { collection: "members" as const, user: { firstName: "Anna", id: 7 } }

const mockPayload = (overrides: Record<string, unknown> = {}) => {
  const payload = {
    create: vi.fn().mockResolvedValue({ id: 200 }),
    db: {
      beginTransaction: vi.fn().mockResolvedValue(1),
      commitTransaction: vi.fn().mockResolvedValue(undefined),
      rollbackTransaction: vi.fn().mockResolvedValue(undefined),
    },
    delete: vi.fn().mockResolvedValue({}),
    findByID: vi.fn(),
    logger: { error: vi.fn() },
    update: vi.fn().mockResolvedValue({}),
    ...overrides,
  }
  // biome-ignore lint/suspicious/noExplicitAny: minimal Payload mock, only the operations the action calls
  vi.mocked(getPayloadClient).mockResolvedValue(payload as any)
  return payload
}

const publishFields = {
  assessments: richText("Weekly sprint reviews."),
  deliveryFormat: "hybrid" as const,
  endDate: "2027-11-06",
  learningOutcomes: richText("Design and ship a production system."),
  name: "Capstone Project",
  programme: "Bachelor of Computer Science",
  projectType: "Industry-sponsored",
  startDate: "2027-07-13",
  term: "semester2" as const,
  year: "2027",
}

beforeEach(() => {
  vi.clearAllMocks()
  // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
  vi.mocked(getCurrentUser).mockResolvedValue(member as any)
})

const draftInput = {
  courseId: 1,
  intent: "draft" as const,
  name: "Capstone Project",
  startFromId: null,
}
const publishInput = { ...draftInput, ...publishFields, intent: "publish" as const }

const source = {
  _status: "draft",
  course: 1,
  id: 4,
  teachingTeam: [
    { id: "a", member: 9, role: "Course Coordinator" },
    { id: "b", member: 7, role: "Tutor" },
  ],
}

const createdData = (payload: ReturnType<typeof mockPayload>) => payload.create.mock.calls[0]?.[0]

describe("createOffering", () => {
  it("refuses without touching Payload when the course is missing", async () => {
    const payload = mockPayload()
    const { courseId: _omitted, ...withoutCourse } = draftInput

    const result = await createOffering(withoutCourse)

    expect(result).toEqual({ formError: "Could not add this offering. Try again.", ok: false })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it("reports invalid form input against its field", async () => {
    const payload = mockPayload()

    const result = await createOffering({ ...publishInput, term: "" })

    expect(result).toEqual({ fieldErrors: { term: "Select a term to publish" }, ok: false })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it("refuses an admin", async () => {
    const payload = mockPayload()
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: "admin", user: { id: 1 } as any })

    const result = await createOffering(draftInput)

    expect(result).toEqual({
      formError: "Only members can add an offering - admins can use the admin panel.",
      ok: false,
    })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it("saves a blank draft for the course as the member, with no teaching team", async () => {
    const payload = mockPayload()

    const result = await createOffering(draftInput)

    expect(result).toEqual({ ok: true })
    expect(createdData(payload)).toMatchObject({
      collection: "courseVersions",
      data: { course: 1, name: "Capstone Project" },
      draft: true,
      overrideAccess: false,
      req: { transactionID: 1 },
      user: member.user,
    })
    expect(createdData(payload).data).not.toHaveProperty("teachingTeam")
    expect(payload.db.commitTransaction).toHaveBeenCalledWith(1)
    expect(updateTag).toHaveBeenCalledWith(QueryKeys.COURSES.ROOT)
    expect(updateTag).toHaveBeenCalledWith(QueryKeys.COURSES.ID(1))
  })

  it("keeps a draft Start from offering's teaching team, read from its newest revision", async () => {
    const payload = mockPayload({ findByID: vi.fn().mockResolvedValue(source) })

    const result = await createOffering({ ...publishInput, startFromId: 4 })

    expect(result).toEqual({ ok: true })
    expect(payload.findByID).toHaveBeenLastCalledWith(
      expect.objectContaining({ draft: true, id: 4, overrideAccess: false, user: member.user }),
    )
    expect(createdData(payload)).toMatchObject({
      data: {
        _status: "published",
        teachingTeam: [
          { member: 9, role: "Course Coordinator" },
          { member: 7, role: "Tutor" },
        ],
      },
      draft: false,
    })
  })

  // Manage offerings copies a published offering's content from its publication, so
  // a pending draft's team must not come with it.
  it("keeps a published Start from offering's team as published", async () => {
    const pendingDraft = { ...source, teachingTeam: [] }
    const payload = mockPayload({
      findByID: vi
        .fn()
        .mockResolvedValueOnce({ ...source, _status: "published" })
        .mockResolvedValueOnce(pendingDraft),
    })

    await createOffering({ ...publishInput, startFromId: 4 })

    expect(payload.findByID).toHaveBeenCalledTimes(1)
    expect(payload.findByID).toHaveBeenCalledWith(expect.objectContaining({ draft: false, id: 4 }))
    expect(createdData(payload).data.teachingTeam).toEqual([
      { member: 9, role: "Course Coordinator" },
      { member: 7, role: "Tutor" },
    ])
  })

  it("refuses a Start from offering from another course", async () => {
    const payload = mockPayload({ findByID: vi.fn().mockResolvedValue({ ...source, course: 2 }) })

    const result = await createOffering({ ...publishInput, startFromId: 4 })

    expect(result).toEqual({ formError: "Could not add this offering. Try again.", ok: false })
    expect(payload.create).not.toHaveBeenCalled()
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith(1)
  })

  it("publishes a blank start with the member as its teaching team", async () => {
    const payload = mockPayload()

    await createOffering({ ...publishInput, role: "Lecturer" })

    expect(createdData(payload).data.teachingTeam).toEqual([{ member: 7, role: "Lecturer" }])
  })

  it("asks for a role to publish a blank start", async () => {
    const payload = mockPayload()

    const result = await createOffering(publishInput)

    expect(result).toEqual({ fieldErrors: { role: "Your role is required to publish" }, ok: false })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it("shows the hooks' refusal of a member who can't edit the course", async () => {
    mockPayload({
      create: vi.fn().mockRejectedValue(new APIError("You cannot edit this course.")),
    })

    const result = await createOffering(draftInput)

    expect(result).toEqual({ formError: "You cannot edit this course.", ok: false })
    expect(updateTag).not.toHaveBeenCalled()
  })

  // Read as the member, so a course they can't read hides the source as well.
  it("refuses a Start from offering the member can't read", async () => {
    const payload = mockPayload({ findByID: vi.fn().mockRejectedValue(new Error("Not Found")) })

    const result = await createOffering({ ...publishInput, startFromId: 4 })

    expect(result).toEqual({ formError: "Could not add this offering. Try again.", ok: false })
    expect(payload.create).not.toHaveBeenCalled()
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith(1)
  })

  it("shows the hooks' refusal of a period the course already has", async () => {
    const payload = mockPayload({
      create: vi
        .fn()
        .mockRejectedValue(
          new APIError("This course already has an offering for Semester 2 2027."),
        ),
    })

    const result = await createOffering({ ...publishInput, role: "Lecturer" })

    expect(result).toEqual({
      formError: "This course already has an offering for Semester 2 2027.",
      ok: false,
    })
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith(1)
    expect(updateTag).not.toHaveBeenCalled()
  })
})
