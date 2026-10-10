import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { updateDraftCourse } from "./updateDraftCourse"

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
    children: [
      { type: "paragraph", version: 1, children: text ? [{ type: "text", version: 1, text }] : [] },
    ],
    direction: null,
    format: "" as const,
    indent: 0,
    version: 1,
  },
})

const draftInput = {
  code: "CS399",
  courseId: 1,
  intent: "draft" as const,
  name: "Capstone Project",
  versionId: 100,
}

const publishInput = {
  ...draftInput,
  assessments: richText("Weekly sprint reviews."),
  deliveryFormat: "hybrid" as const,
  endDate: "2026-11-06",
  intent: "publish" as const,
  learningOutcomes: richText("Design and ship a production system."),
  period: "Semester 2, 2026",
  programme: "Bachelor of Computer Science",
  projectType: "Industry-sponsored",
  role: "Course Coordinator",
  startDate: "2026-07-13",
}

const member = { collection: "members" as const, user: { firstName: "Anna", id: 7 } }

const mockPayload = (overrides: Record<string, unknown> = {}) => {
  const payload = {
    db: {
      beginTransaction: vi.fn().mockResolvedValue(1),
      commitTransaction: vi.fn().mockResolvedValue(undefined),
      rollbackTransaction: vi.fn().mockResolvedValue(undefined),
    },
    findByID: vi.fn().mockResolvedValue({ code: "CS399", hasPublishedVersion: false, id: 1 }),
    logger: { error: vi.fn() },
    update: vi.fn().mockResolvedValue({}),
    ...overrides,
  }
  // biome-ignore lint/suspicious/noExplicitAny: minimal Payload mock, only the operations the action calls
  vi.mocked(getPayloadClient).mockResolvedValue(payload as any)
  return payload
}

const versionUpdate = (payload: ReturnType<typeof mockPayload>) =>
  payload.update.mock.calls.find(([args]) => args.collection === "courseVersions")?.[0]

describe("updateDraftCourse", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue(member as any)
  })

  it("refuses without touching Payload when the draft's ids are missing", async () => {
    const payload = mockPayload()
    const { versionId: _omitted, ...withoutVersion } = draftInput

    const result = await updateDraftCourse(withoutVersion)

    expect(result).toEqual({ formError: "Could not save this course. Try again.", ok: false })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("reports invalid form input against its field without touching Payload", async () => {
    const payload = mockPayload()

    const result = await updateDraftCourse({ ...draftInput, code: "" })

    expect(result).toEqual({ fieldErrors: { code: "Course code is required" }, ok: false })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("refuses when nobody is signed in", async () => {
    const payload = mockPayload()
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })

    const result = await updateDraftCourse(draftInput)

    expect(result).toEqual({ formError: "Sign in to edit a course.", ok: false })
    expect(payload.findByID).not.toHaveBeenCalled()
  })

  it("refuses an admin with a message about editing, not adding", async () => {
    const payload = mockPayload()
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "admin",
      // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
      user: { id: 1 } as any,
    })

    const result = await updateDraftCourse(draftInput)

    expect(result).toEqual({
      formError: "Only members can edit a course - admins manage the directory, not entries in it.",
      ok: false,
    })
    expect(payload.findByID).not.toHaveBeenCalled()
  })

  describe("draft", () => {
    it("saves over the existing offering as a draft, as the member, without creating anything", async () => {
      const payload = mockPayload()

      const result = await updateDraftCourse(draftInput)

      expect(result).toEqual({ ok: true })
      expect(payload.update).toHaveBeenCalledTimes(1)
      expect(versionUpdate(payload)).toEqual(
        expect.objectContaining({
          collection: "courseVersions",
          data: expect.objectContaining({ course: 1, name: draftInput.name }),
          draft: true,
          id: 100,
          overrideAccess: false,
          req: { transactionID: 1 },
          user: member.user,
        }),
      )
      expect(versionUpdate(payload)?.data).not.toHaveProperty("teachingTeam")
      expect(payload.db.commitTransaction).toHaveBeenCalledWith(1)
      expect(updateTag).toHaveBeenCalledWith(QueryKeys.COURSES.ROOT)
    })

    // An update keeps any key it isn't sent, so `undefined` - what createCourse
    // sends - would leave a field the user cleared still holding its old value.
    it("sends cleared fields as null so the saved values are actually removed", async () => {
      const payload = mockPayload()

      await updateDraftCourse({
        ...draftInput,
        additionalInfo: richText(" "),
        assessments: null,
        deliveryFormat: "",
        endDate: "",
        period: "",
        programme: "",
        projectType: "",
        startDate: "",
      })

      expect(versionUpdate(payload)?.data).toEqual(
        expect.objectContaining({
          additionalInfo: null,
          assessments: null,
          deliveryFormat: null,
          endDate: null,
          learningOutcomes: null,
          period: null,
          programme: null,
          projectType: null,
          startDate: null,
        }),
      )
    })

    it("leaves the course alone when its code hasn't changed", async () => {
      const payload = mockPayload()

      await updateDraftCourse(draftInput)

      expect(payload.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ collection: "courses" }),
      )
    })

    it("renames the course in the same transaction when its code changed", async () => {
      const payload = mockPayload()

      await updateDraftCourse({ ...draftInput, code: "CS400" })

      expect(payload.update).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          collection: "courses",
          data: { code: "CS400" },
          id: 1,
          overrideAccess: false,
          req: { transactionID: 1 },
          user: member.user,
        }),
      )
    })
  })

  describe("publish", () => {
    it("publishes the same offering with the member as its sole teaching-team member", async () => {
      const payload = mockPayload()

      const result = await updateDraftCourse(publishInput)

      expect(result).toEqual({ ok: true })
      expect(versionUpdate(payload)).toEqual(
        expect.objectContaining({
          data: expect.objectContaining({
            _status: "published",
            name: publishInput.name,
            teachingTeam: [{ member: member.user.id, role: publishInput.role }],
          }),
          draft: false,
          id: 100,
        }),
      )
    })

    it("rejects a publish missing a publication field, without touching Payload", async () => {
      const payload = mockPayload()
      const { role: _omitted, ...incomplete } = publishInput

      const result = await updateDraftCourse(incomplete)

      expect(result).toHaveProperty("fieldErrors.role")
      expect(payload.update).not.toHaveBeenCalled()
    })
  })

  it("refuses a course that was published since the table loaded", async () => {
    const payload = mockPayload({
      findByID: vi.fn().mockResolvedValue({ code: "CS399", hasPublishedVersion: true, id: 1 }),
    })

    const result = await updateDraftCourse(draftInput)

    expect(result).toEqual({ formError: "This course has already been published.", ok: false })
    expect(payload.update).not.toHaveBeenCalled()
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith(1)
  })

  it("surfaces a hook's APIError as a form-level message and rolls back", async () => {
    const payload = mockPayload({
      update: vi.fn().mockRejectedValue(new APIError("The offering's course cannot change.")),
    })

    const result = await updateDraftCourse(draftInput)

    expect(result).toEqual({ formError: "The offering's course cannot change.", ok: false })
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith(1)
    expect(payload.db.commitTransaction).not.toHaveBeenCalled()
  })

  it("reports a field error from a validation failure", async () => {
    mockPayload({
      update: vi
        .fn()
        .mockRejectedValue(new ValidationError([{ message: "Code taken", path: "code" }])),
    })

    expect(await updateDraftCourse(draftInput)).toEqual({
      fieldErrors: { code: "Code taken" },
      ok: false,
    })
  })

  it("reports a generic failure, logs it and rolls back when Payload throws something else", async () => {
    const payload = mockPayload({
      update: vi.fn().mockRejectedValue(new Error("connection lost")),
    })

    const result = await updateDraftCourse(draftInput)

    expect(result).toEqual({ formError: "Could not save this course. Try again.", ok: false })
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith(1)
    expect(payload.logger.error).toHaveBeenCalled()
    expect(updateTag).not.toHaveBeenCalled()
  })
})
