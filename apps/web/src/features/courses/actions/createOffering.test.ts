import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { createOffering } from "./createOffering"

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
  endDate: "2027-06-25",
  intent: "publish" as const,
  learningOutcomes: richText("Design and ship a production system."),
  name: "Capstone Project",
  period: "Semester 1 2027",
  programme: "Bachelor of Computer Science",
  projectType: "Industry-sponsored",
  sourceId: 10,
  startDate: "2027-03-01",
}

const source = {
  course: 1,
  id: 10,
  teachingTeam: [{ id: "row-1", member: 7, role: "Course Coordinator" }],
}

const member = { collection: "members" as const, user: { id: 7 } }

const mockPayload = (overrides: Record<string, unknown> = {}) => {
  const payload = {
    create: vi.fn().mockResolvedValue({ id: 11 }),
    findByID: vi.fn().mockResolvedValue(source),
    logger: { error: vi.fn() },
    ...overrides,
  }
  // biome-ignore lint/suspicious/noExplicitAny: minimal Payload mock, only the operations the action calls
  vi.mocked(getPayloadClient).mockResolvedValue(payload as any)
  return payload
}

describe("createOffering", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue(member as any)
  })

  it("rejects an incomplete offering without touching Payload", async () => {
    const payload = mockPayload()

    const result = await createOffering({ ...input, period: "" })

    expect(result).toEqual({ fieldErrors: { period: "Teaching period is required" }, ok: false })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it("refuses an admin", async () => {
    const payload = mockPayload()
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: "admin", user: { id: 1 } } as any)

    const result = await createOffering(input)

    expect(result.ok).toBe(false)
    expect(payload.create).not.toHaveBeenCalled()
  })

  it("publishes the offering as the member, keeping the source's teaching team", async () => {
    const payload = mockPayload()

    const result = await createOffering(input)

    expect(result).toEqual({ ok: true })
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "courseVersions",
        data: expect.objectContaining({
          _status: "published",
          course: 1,
          period: "Semester 1 2027",
          teachingTeam: [{ member: 7, role: "Course Coordinator" }],
        }),
        draft: false,
        overrideAccess: false,
        user: member.user,
      }),
    )
    expect(updateTag).toHaveBeenCalledWith(QueryKeys.COURSES.ID(1))
  })

  it("saves a draft with only a name, keeping the source's teaching team for later", async () => {
    const payload = mockPayload()

    const result = await createOffering({
      courseId: 1,
      endDate: "",
      intent: "draft",
      name: "Capstone Project",
      period: "",
      sourceId: 10,
      startDate: "",
    })

    expect(result).toEqual({ ok: true })
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          course: 1,
          period: undefined,
          teachingTeam: [{ member: 7, role: "Course Coordinator" }],
        }),
        draft: true,
        overrideAccess: false,
        user: member.user,
      }),
    )
    expect(payload.create.mock.calls[0][0].data).not.toHaveProperty("_status")
  })

  it("leaves out teaching-team rows whose member has been deleted", async () => {
    const payload = mockPayload({
      findByID: vi.fn().mockResolvedValue({
        ...source,
        teachingTeam: [...source.teachingTeam, { id: "row-2", member: null, role: "Tutor" }],
      }),
    })

    await createOffering(input)

    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          teachingTeam: [{ member: 7, role: "Course Coordinator" }],
        }),
      }),
    )
  })

  it("refuses a source offering from another course", async () => {
    const payload = mockPayload({ findByID: vi.fn().mockResolvedValue({ ...source, course: 2 }) })

    const result = await createOffering(input)

    expect(result).toEqual({ formError: "Could not add this offering. Try again.", ok: false })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it("shows a course hook's refusal as the form error", async () => {
    mockPayload({ create: vi.fn().mockRejectedValue(new APIError("You cannot edit this course.")) })

    const result = await createOffering(input)

    expect(result).toEqual({ formError: "You cannot edit this course.", ok: false })
  })
})
