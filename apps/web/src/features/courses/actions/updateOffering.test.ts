import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { updateOffering } from "./updateOffering"

const { APIError, ValidationError } = vi.hoisted(() => {
  class ValidationError extends Error {}
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

const input = {
  assessments: richText("Weekly sprint reviews."),
  courseId: 1,
  deliveryFormat: "hybrid" as const,
  endDate: "2026-11-06",
  learningOutcomes: richText("Design and ship a production system."),
  name: "Capstone Project",
  offeringId: 10,
  period: "Semester 2 2026",
  programme: "Bachelor of Computer Science",
  projectType: "Industry-sponsored",
  startDate: "2026-07-20",
}

const offering = {
  _status: "published",
  course: 1,
  id: 10,
  teachingTeam: [{ member: 7, role: "Course coordinator" }],
}

const member = { collection: "members" as const, user: { id: 7 } }

const mockPayload = (overrides: Record<string, unknown> = {}) => {
  const payload = {
    findByID: vi.fn().mockResolvedValue(offering),
    logger: { error: vi.fn() },
    update: vi.fn().mockResolvedValue(offering),
    ...overrides,
  }
  // biome-ignore lint/suspicious/noExplicitAny: minimal Payload mock, only the operations the action calls
  vi.mocked(getPayloadClient).mockResolvedValue(payload as any)
  return payload
}

describe("updateOffering", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue(member as any)
  })

  it("rejects an incomplete offering without touching Payload", async () => {
    const payload = mockPayload()

    const result = await updateOffering({ ...input, name: "" })

    expect(result.ok).toBe(false)
    expect(result).toHaveProperty("fieldErrors.name")
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("republishes the offering as the member, keeping its teaching team", async () => {
    const payload = mockPayload()

    const result = await updateOffering(input)

    expect(result).toEqual({ ok: true })
    expect(payload.findByID).toHaveBeenCalledWith(expect.objectContaining({ draft: true, id: 10 }))
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "courseVersions",
        data: expect.objectContaining({
          _status: "published",
          period: "Semester 2 2026",
          teachingTeam: [{ member: 7, role: "Course coordinator" }],
        }),
        draft: false,
        id: 10,
        overrideAccess: false,
        user: member.user,
      }),
    )
    expect(updateTag).toHaveBeenCalledWith(QueryKeys.COURSES.ID(1))
  })

  it("leaves out a teaching-team row whose member has been deleted", async () => {
    const payload = mockPayload({
      findByID: vi.fn().mockResolvedValue({
        ...offering,
        teachingTeam: [...offering.teachingTeam, { member: null, role: "Tutor" }],
      }),
    })

    const result = await updateOffering(input)

    expect(result).toEqual({ ok: true })
    expect(payload.update.mock.calls[0][0].data.teachingTeam).toEqual(offering.teachingTeam)
  })

  it("saves the teaching team the dialog sends", async () => {
    const payload = mockPayload()
    const teachingTeam = [
      { member: 7, role: "Course coordinator" },
      { member: 8, role: "Tutor" },
    ]

    const result = await updateOffering({ ...input, teachingTeam })

    expect(result).toEqual({ ok: true })
    expect(payload.update.mock.calls[0][0].data.teachingTeam).toEqual(teachingTeam)
  })

  it("refuses a sent teaching team that is empty", async () => {
    const payload = mockPayload()

    const result = await updateOffering({ ...input, teachingTeam: [] })

    expect(result).toEqual({
      formError: "Add at least one teaching team member to publish.",
      ok: false,
    })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("refuses a teaching team that lists a member twice", async () => {
    const payload = mockPayload()

    const result = await updateOffering({
      ...input,
      teachingTeam: [
        { member: 8, role: "Tutor" },
        { member: 8, role: "Lecturer" },
      ],
    })

    expect(result).toEqual({
      formError: "Each member can be on the teaching team once.",
      ok: false,
    })
    expect(payload.findByID).not.toHaveBeenCalled()
  })

  it("refuses an offering with no teaching team left", async () => {
    const payload = mockPayload({
      findByID: vi.fn().mockResolvedValue({
        ...offering,
        teachingTeam: [{ member: null, role: "Course coordinator" }],
      }),
    })

    const result = await updateOffering(input)

    expect(result).toEqual({
      formError: "Add at least one teaching team member to publish.",
      ok: false,
    })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("refuses an offering from another course", async () => {
    const payload = mockPayload({ findByID: vi.fn().mockResolvedValue({ ...offering, course: 2 }) })

    const result = await updateOffering(input)

    expect(result).toEqual({ formError: "Could not save this offering. Try again.", ok: false })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("refuses an offering whose newest version is a draft, which saving here would publish", async () => {
    const payload = mockPayload({
      findByID: vi.fn().mockResolvedValue({ ...offering, _status: "draft" }),
    })

    const result = await updateOffering(input)

    expect(result).toEqual({
      formError: "This offering has unpublished draft changes, so it can't be edited here.",
      ok: false,
    })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("shows the hook's refusal of an unchanged offering as the form error", async () => {
    mockPayload({
      update: vi.fn().mockRejectedValue(new APIError("The correction has no content changes.")),
    })

    const result = await updateOffering(input)

    expect(result).toEqual({ formError: "The correction has no content changes.", ok: false })
  })
})
