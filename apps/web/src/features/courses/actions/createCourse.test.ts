import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { createCourse } from "./createCourse"

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
  intent: "draft" as const,
  name: "Capstone Project",
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
    create: vi.fn().mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce({ id: 100 }),
    db: {
      beginTransaction: vi.fn().mockResolvedValue(1),
      commitTransaction: vi.fn().mockResolvedValue(undefined),
      rollbackTransaction: vi.fn().mockResolvedValue(undefined),
    },
    logger: { error: vi.fn() },
    ...overrides,
  }
  // biome-ignore lint/suspicious/noExplicitAny: minimal Payload mock, only the operations the action calls
  vi.mocked(getPayloadClient).mockResolvedValue(payload as any)
  return payload
}

describe("createCourse", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue(member as any)
  })

  it("rejects invalid input without touching Payload", async () => {
    const payload = mockPayload()

    const result = await createCourse({ ...draftInput, code: "" })

    expect(result).toEqual({ fieldErrors: { code: "Course code is required" }, ok: false })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it("rejects an end date before the start date when both are given on a draft", async () => {
    mockPayload()

    const result = await createCourse({
      ...draftInput,
      endDate: "2026-01-01",
      startDate: "2026-02-01",
    })

    expect(result.ok).toBe(false)
    expect(result).toHaveProperty("fieldErrors.endDate")
  })

  it("refuses when nobody is signed in", async () => {
    const payload = mockPayload()
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })

    const result = await createCourse(draftInput)

    expect(result).toEqual({ formError: "Sign in to add a course.", ok: false })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it("refuses an admin with a message that doesn't imply they aren't signed in", async () => {
    const payload = mockPayload()
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "admin",
      // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
      user: { id: 1 } as any,
    })

    const result = await createCourse(draftInput)

    expect(result).toEqual({
      formError: "Only members can add a course - admins manage the directory, not entries in it.",
      ok: false,
    })
    expect(payload.create).not.toHaveBeenCalled()
  })

  describe("draft", () => {
    it("creates the course and its first offering as a draft with just a code and name, inside one transaction", async () => {
      const payload = mockPayload()

      const result = await createCourse(draftInput)

      expect(result).toEqual({ ok: true })
      expect(payload.db.beginTransaction).toHaveBeenCalled()
      expect(payload.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          collection: "courses",
          data: { code: "CS399" },
          req: { transactionID: 1 },
          user: member.user,
        }),
      )
      expect(payload.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          collection: "courseVersions",
          data: expect.objectContaining({
            course: 1,
            endDate: undefined,
            name: draftInput.name,
            period: undefined,
            startDate: undefined,
          }),
          draft: true,
          req: { transactionID: 1 },
          user: member.user,
        }),
      )
      expect(payload.create.mock.calls[1]?.[0].data).not.toHaveProperty("teachingTeam")
      expect(payload.db.commitTransaction).toHaveBeenCalledWith(1)
      expect(payload.db.rollbackTransaction).not.toHaveBeenCalled()
    })

    // The real dialog always sends every field, blank ones as "" rather than
    // omitted - Payload's date columns reject "" outright, so this has to
    // reach create() as undefined, not just be absent from a fixture.
    it("sends blank optional fields as undefined, not empty strings", async () => {
      const payload = mockPayload()

      await createCourse({
        ...draftInput,
        deliveryFormat: "",
        endDate: "",
        period: "",
        programme: "",
        projectType: "",
        startDate: "",
      })

      expect(payload.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          data: expect.objectContaining({
            deliveryFormat: undefined,
            endDate: undefined,
            period: undefined,
            programme: undefined,
            projectType: undefined,
            startDate: undefined,
          }),
        }),
      )
    })

    it("sends rich text with no visible text as undefined", async () => {
      const payload = mockPayload()

      await createCourse({
        ...draftInput,
        additionalInfo: richText(" "),
        assessments: richText(""),
        learningOutcomes: null,
      })

      expect(payload.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          data: expect.objectContaining({
            additionalInfo: undefined,
            assessments: undefined,
            learningOutcomes: undefined,
          }),
        }),
      )
    })

    it("rejects a draft submission missing the course name, without touching Payload", async () => {
      const payload = mockPayload()
      const { name: _omitted, ...incomplete } = draftInput

      const result = await createCourse(incomplete)

      expect(result.ok).toBe(false)
      expect(result).toHaveProperty("fieldErrors.name")
      expect(payload.create).not.toHaveBeenCalled()
    })

    it("still carries the teaching period through when a draft is saved with one already", async () => {
      const payload = mockPayload()

      await createCourse({
        ...draftInput,
        endDate: "2026-11-06",
        period: "Semester 2, 2026",
        startDate: "2026-07-13",
      })

      expect(payload.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          data: expect.objectContaining({
            endDate: "2026-11-06",
            period: "Semester 2, 2026",
            startDate: "2026-07-13",
          }),
        }),
      )
    })
  })

  describe("publish", () => {
    it("rejects a publish submission missing a publication field, without touching Payload", async () => {
      const payload = mockPayload()
      const { name: _omitted, ...incomplete } = publishInput

      const result = await createCourse(incomplete)

      expect(result.ok).toBe(false)
      expect(result).toHaveProperty("fieldErrors.name")
      expect(payload.create).not.toHaveBeenCalled()
    })

    it("publishes the offering with the signed-in creator as the sole teaching-team member", async () => {
      const payload = mockPayload()

      const result = await createCourse(publishInput)

      expect(result).toEqual({ ok: true })
      expect(payload.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          collection: "courseVersions",
          data: expect.objectContaining({
            // `draft: false` alone doesn't make prepareVersion treat this as
            // a publish - it reads `_status` off the data itself, so this
            // has to be sent explicitly (matches the seed script's own
            // published-offering writes).
            _status: "published",
            assessments: publishInput.assessments,
            course: 1,
            learningOutcomes: publishInput.learningOutcomes,
            name: publishInput.name,
            teachingTeam: [{ member: member.user.id, role: publishInput.role }],
          }),
          draft: false,
          req: { transactionID: 1 },
          user: member.user,
        }),
      )
      expect(payload.db.commitTransaction).toHaveBeenCalledWith(1)
      expect(updateTag).toHaveBeenCalledWith(QueryKeys.COURSES.ROOT)
    })

    it("surfaces a hook's APIError as a form-level message rather than a generic one", async () => {
      const payload = mockPayload({
        create: vi
          .fn()
          .mockResolvedValueOnce({ id: 1 })
          .mockRejectedValueOnce(
            new APIError(
              "Publication requires a teaching team with a member and role in each row.",
            ),
          ),
      })

      const result = await createCourse(publishInput)

      expect(result).toEqual({
        formError: "Publication requires a teaching team with a member and role in each row.",
        ok: false,
      })
      expect(payload.db.rollbackTransaction).toHaveBeenCalledWith(1)
    })
  })

  it("rolls back the transaction and reports a field error when the offering fails validation", async () => {
    const payload = mockPayload({
      create: vi
        .fn()
        .mockResolvedValueOnce({ id: 1 })
        .mockRejectedValueOnce(
          new ValidationError([
            {
              message: "A period label and valid start and end dates are required.",
              path: "period",
            },
          ]),
        ),
    })

    const result = await createCourse(draftInput)

    expect(result).toEqual({
      fieldErrors: { period: "A period label and valid start and end dates are required." },
      ok: false,
    })
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith(1)
    expect(payload.db.commitTransaction).not.toHaveBeenCalled()
  })

  it("falls back to a form error when a validation error has no usable field path", async () => {
    const payload = mockPayload({
      create: vi
        .fn()
        .mockResolvedValueOnce({ id: 1 })
        .mockRejectedValueOnce(new ValidationError([])),
    })

    const result = await createCourse(draftInput)

    expect(result).toEqual({ formError: "Could not add this course. Try again.", ok: false })
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith(1)
  })

  it("reports a generic failure and rolls back when Payload throws something else", async () => {
    const payload = mockPayload({
      create: vi.fn().mockRejectedValueOnce(new Error("connection lost")),
    })

    const result = await createCourse(draftInput)

    expect(result).toEqual({ formError: "Could not add this course. Try again.", ok: false })
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith(1)
    expect(payload.logger.error).toHaveBeenCalled()
    expect(updateTag).not.toHaveBeenCalled()
  })

  it("still creates the course when the adapter cannot open a transaction", async () => {
    const payload = mockPayload({
      db: {
        beginTransaction: vi.fn().mockResolvedValue(null),
        commitTransaction: vi.fn(),
        rollbackTransaction: vi.fn(),
      },
    })

    const result = await createCourse(draftInput)

    expect(result).toEqual({ ok: true })
    expect(payload.create).toHaveBeenNthCalledWith(1, expect.objectContaining({ req: undefined }))
    expect(payload.db.commitTransaction).not.toHaveBeenCalled()
    expect(payload.db.rollbackTransaction).not.toHaveBeenCalled()
  })
})
