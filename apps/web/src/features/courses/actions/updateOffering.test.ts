import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { updateOffering } from "./updateOffering"

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
  offeringId: 4,
}
const publishInput = { ...draftInput, ...publishFields, intent: "publish" as const }
const correctionInput = { ...publishInput, changeSummary: "Moved the final presentation" }

const draftRow = { _status: "draft", course: 1, id: 4 }
const publishedRow = { _status: "published", course: 1, id: 4 }

const updatedData = (payload: ReturnType<typeof mockPayload>) => payload.update.mock.calls[0]?.[0]

describe("updateOffering", () => {
  it("refuses without touching Payload when the offering is missing", async () => {
    const payload = mockPayload()
    const { offeringId: _omitted, ...withoutOffering } = draftInput

    const result = await updateOffering(withoutOffering)

    expect(result).toEqual({ formError: "Could not save this offering. Try again.", ok: false })
    expect(payload.findByID).not.toHaveBeenCalled()
  })

  it("refuses when nobody is signed in", async () => {
    const payload = mockPayload()
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })

    const result = await updateOffering(draftInput)

    expect(result).toEqual({ formError: "Sign in to edit an offering.", ok: false })
    expect(payload.findByID).not.toHaveBeenCalled()
  })

  it("refuses an offering from another course", async () => {
    const payload = mockPayload({ findByID: vi.fn().mockResolvedValue({ ...draftRow, course: 2 }) })

    const result = await updateOffering(draftInput)

    expect(result).toEqual({ formError: "Could not save this offering. Try again.", ok: false })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("shows the hooks' refusal of a member who can't edit the course", async () => {
    mockPayload({
      findByID: vi.fn().mockResolvedValue(draftRow),
      update: vi.fn().mockRejectedValue(new APIError("You cannot edit this course.")),
    })

    const result = await updateOffering(draftInput)

    expect(result).toEqual({ formError: "You cannot edit this course.", ok: false })
  })

  describe("a draft", () => {
    it("saves as a draft, clearing blank fields", async () => {
      const payload = mockPayload({ findByID: vi.fn().mockResolvedValue(draftRow) })

      const result = await updateOffering(draftInput)

      expect(result).toEqual({ ok: true })
      expect(updatedData(payload)).toMatchObject({
        data: { course: 1, name: "Capstone Project", startDate: null, term: null },
        draft: true,
        id: 4,
        overrideAccess: false,
        user: member.user,
      })
      expect(updateTag).toHaveBeenCalledWith(QueryKeys.COURSES.ID(1))
    })

    it("publishes with the teaching team its last revision saved", async () => {
      const findByID = vi
        .fn()
        .mockResolvedValueOnce(draftRow)
        .mockResolvedValueOnce({ ...draftRow, teachingTeam: [{ member: 9, role: "Coordinator" }] })
      const payload = mockPayload({ findByID })

      const result = await updateOffering(publishInput)

      expect(result).toEqual({ ok: true })
      expect(findByID).toHaveBeenLastCalledWith(expect.objectContaining({ draft: true, id: 4 }))
      expect(updatedData(payload)).toMatchObject({
        data: { _status: "published", teachingTeam: [{ member: 9, role: "Coordinator" }] },
        draft: false,
      })
    })

    it("publishes one with no teaching team with the member and their role", async () => {
      const payload = mockPayload({ findByID: vi.fn().mockResolvedValue(draftRow) })

      await updateOffering({ ...publishInput, role: "Lecturer" })

      expect(updatedData(payload).data.teachingTeam).toEqual([{ member: 7, role: "Lecturer" }])
    })

    it("asks for a role to publish one with no teaching team", async () => {
      const payload = mockPayload({ findByID: vi.fn().mockResolvedValue(draftRow) })

      const result = await updateOffering(publishInput)

      expect(result).toEqual({
        fieldErrors: { role: "Your role is required to publish" },
        ok: false,
      })
      expect(payload.update).not.toHaveBeenCalled()
    })
  })

  // A draft's period is claimed too, so moving it onto a taken one is refused.
  it("shows the hooks' refusal when a draft moves to a period the course already has", async () => {
    const payload = mockPayload({
      findByID: vi.fn().mockResolvedValue(draftRow),
      update: vi
        .fn()
        .mockRejectedValue(
          new APIError("This course already has an offering for Semester 2 2027."),
        ),
    })

    const result = await updateOffering({ ...draftInput, term: "semester2", year: "2027" })

    expect(result).toEqual({
      formError: "This course already has an offering for Semester 2 2027.",
      ok: false,
    })
    expect(updatedData(payload)).toMatchObject({
      data: { term: "semester2", year: 2027 },
      draft: true,
    })
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith(1)
  })

  describe("a published offering", () => {
    it("publishes the correction straight away with its summary, keeping the teaching team", async () => {
      const payload = mockPayload({ findByID: vi.fn().mockResolvedValue(publishedRow) })

      const result = await updateOffering(correctionInput)

      expect(result).toEqual({ ok: true })
      expect(payload.findByID).toHaveBeenCalledTimes(1)
      expect(updatedData(payload)).toMatchObject({
        data: { _status: "published", changeSummary: "Moved the final presentation" },
        draft: false,
        id: 4,
      })
      expect(updatedData(payload).data).not.toHaveProperty("teachingTeam")
    })

    it("asks what changed", async () => {
      const payload = mockPayload({ findByID: vi.fn().mockResolvedValue(publishedRow) })

      const result = await updateOffering({ ...correctionInput, changeSummary: "  " })

      expect(result).toEqual({
        fieldErrors: { changeSummary: "Say what changed to publish a correction" },
        ok: false,
      })
      expect(payload.update).not.toHaveBeenCalled()
      expect(payload.db.rollbackTransaction).toHaveBeenCalledWith(1)
    })

    it("never saves it back as a draft", async () => {
      const payload = mockPayload({ findByID: vi.fn().mockResolvedValue(publishedRow) })

      const result = await updateOffering({ ...draftInput, changeSummary: "Typo" })

      expect(result).toEqual({
        formError: "This offering has been published, so changes go live straight away.",
        ok: false,
      })
      expect(payload.update).not.toHaveBeenCalled()
    })

    it("shows the hooks' refusal of a period the course already has", async () => {
      const payload = mockPayload({
        findByID: vi.fn().mockResolvedValue(publishedRow),
        update: vi
          .fn()
          .mockRejectedValue(
            new APIError("This course already has an offering for Semester 2 2027."),
          ),
      })

      const result = await updateOffering(correctionInput)

      expect(result).toEqual({
        formError: "This course already has an offering for Semester 2 2027.",
        ok: false,
      })
      expect(payload.db.rollbackTransaction).toHaveBeenCalledWith(1)
      expect(updateTag).not.toHaveBeenCalled()
    })

    it("shows the hooks' refusal of a correction that changes nothing", async () => {
      mockPayload({
        findByID: vi.fn().mockResolvedValue(publishedRow),
        update: vi.fn().mockRejectedValue(new APIError("The correction has no content changes.")),
      })

      const result = await updateOffering(correctionInput)

      expect(result).toEqual({ formError: "The correction has no content changes.", ok: false })
    })
  })
})
