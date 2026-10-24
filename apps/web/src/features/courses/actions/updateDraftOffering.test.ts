import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { updateDraftOffering } from "./updateDraftOffering"

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
  intent: "publish" as const,
  learningOutcomes: richText("Design and ship a production system."),
  name: "Capstone Project",
  offeringId: 10,
  period: "Semester 2 2026",
  programme: "Bachelor of Computer Science",
  projectType: "Industry-sponsored",
  startDate: "2026-07-20",
}

const offering = {
  _status: "draft",
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

describe("updateDraftOffering", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue(member as any)
  })

  it("rejects publishing an incomplete draft without touching Payload", async () => {
    const payload = mockPayload()

    const result = await updateDraftOffering({ ...input, period: "" })

    expect(result).toEqual({ fieldErrors: { period: "Teaching period is required" }, ok: false })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("saves a draft that's still missing its period and dates", async () => {
    const payload = mockPayload()

    const result = await updateDraftOffering({
      ...input,
      endDate: "",
      intent: "draft",
      period: "",
      startDate: "",
    })

    expect(result).toEqual({ ok: true })
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ period: null, startDate: null }),
        draft: true,
        id: 10,
        overrideAccess: false,
        user: member.user,
      }),
    )
    expect(payload.update.mock.calls[0][0].data).not.toHaveProperty("_status")
  })

  it("publishes the draft as the member, keeping its teaching team", async () => {
    const payload = mockPayload()

    const result = await updateDraftOffering(input)

    expect(result).toEqual({ ok: true })
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          _status: "published",
          period: "Semester 2 2026",
          teachingTeam: offering.teachingTeam,
        }),
        draft: false,
        id: 10,
      }),
    )
    expect(updateTag).toHaveBeenCalledWith(QueryKeys.COURSES.ID(1))
  })

  it("leaves out a teaching-team row whose member has been deleted when publishing", async () => {
    const payload = mockPayload({
      findByID: vi.fn().mockResolvedValue({
        ...offering,
        teachingTeam: [...offering.teachingTeam, { member: null, role: "Tutor" }],
      }),
    })

    const result = await updateDraftOffering(input)

    expect(result).toEqual({ ok: true })
    expect(payload.update.mock.calls[0][0].data.teachingTeam).toEqual(offering.teachingTeam)
  })

  it("refuses to publish a draft with no teaching team left", async () => {
    const payload = mockPayload({
      findByID: vi.fn().mockResolvedValue({
        ...offering,
        teachingTeam: [{ member: null, role: "Course coordinator" }],
      }),
    })

    const result = await updateDraftOffering(input)

    expect(result).toEqual({
      formError: "This offering has no teaching team left. Ask an admin to add one.",
      ok: false,
    })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("refuses an offering from another course", async () => {
    const payload = mockPayload({ findByID: vi.fn().mockResolvedValue({ ...offering, course: 2 }) })

    const result = await updateDraftOffering(input)

    expect(result).toEqual({ formError: "Could not save this draft. Try again.", ok: false })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("refuses an offering that has since been published", async () => {
    const payload = mockPayload({
      findByID: vi.fn().mockResolvedValue({ ...offering, _status: "published" }),
    })

    const result = await updateDraftOffering({ ...input, intent: "draft" })

    expect(result).toEqual({ formError: "This offering has already been published.", ok: false })
    expect(payload.update).not.toHaveBeenCalled()
  })
})
