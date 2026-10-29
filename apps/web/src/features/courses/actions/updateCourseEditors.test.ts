import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { updateCourseEditors } from "./updateCourseEditors"

const { APIError, ValidationError } = vi.hoisted(() => {
  class ValidationError extends Error {
    data: { errors: { message: string; path: string }[] }
    constructor(errors: { message: string; path: string }[] = []) {
      super("Validation failed")
      this.data = { errors }
    }
  }
  class APIError extends Error {
    constructor(
      message: string,
      readonly status = 400,
    ) {
      super(message)
    }
  }
  return { APIError, ValidationError }
})

vi.mock("payload", () => ({ APIError, ValidationError }))
vi.mock("next/cache", () => ({ updateTag: vi.fn() }))
vi.mock("@/lib/payload/getPayloadClient", () => ({ getPayloadClient: vi.fn() }))
vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))

const member = { collection: "members" as const, user: { id: 7 } }

const mockPayload = (overrides: Record<string, unknown> = {}) => {
  const payload = {
    logger: { error: vi.fn() },
    update: vi.fn().mockResolvedValue({}),
    ...overrides,
  }
  // biome-ignore lint/suspicious/noExplicitAny: minimal Payload mock, only the operations the action calls
  vi.mocked(getPayloadClient).mockResolvedValue(payload as any)
  return payload
}

describe("updateCourseEditors", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue(member as any)
  })

  it.each([
    ["no course", { editorIds: [8] }],
    ["a non-numeric editor", { courseId: 4, editorIds: ["8"] }],
    ["the same editor twice", { courseId: 4, editorIds: [8, 8] }],
  ])("refuses %s without touching Payload", async (_label, input) => {
    const payload = mockPayload()

    expect(await updateCourseEditors(input)).toEqual({
      formError: "Could not save the editors. Try again.",
      ok: false,
    })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("refuses when nobody is signed in", async () => {
    const payload = mockPayload()
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })

    expect(await updateCourseEditors({ courseId: 4, editorIds: [] })).toEqual({
      formError: "Sign in to manage editors.",
      ok: false,
    })
    expect(payload.update).not.toHaveBeenCalled()
  })

  it("refuses an admin", async () => {
    const payload = mockPayload()
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: "admin", user: { id: 1 } } as any)

    expect(await updateCourseEditors({ courseId: 4, editorIds: [] })).toHaveProperty("formError")
    expect(payload.update).not.toHaveBeenCalled()
  })

  // The course hooks drop the owner and repeated members from the list.
  it("saves the editors as the member", async () => {
    const payload = mockPayload()

    expect(await updateCourseEditors({ courseId: 4, editorIds: [8, 9] })).toEqual({ ok: true })
    expect(payload.update).toHaveBeenCalledWith({
      collection: "courses",
      data: { editors: [8, 9, 7] },
      id: 4,
      overrideAccess: false,
      user: member.user,
    })
    expect(updateTag).toHaveBeenCalledWith(QueryKeys.COURSES.ROOT)
    expect(updateTag).toHaveBeenCalledWith(QueryKeys.COURSES.ID(4))
  })

  it("hands the course to an editor and keeps the old owner as one", async () => {
    const payload = mockPayload()

    expect(await updateCourseEditors({ courseId: 4, editorIds: [8, 9], ownerId: 8 })).toEqual({
      ok: true,
    })
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { editors: [8, 9, 7], owner: 8 } }),
    )
  })

  // resultFromWriteError is shared with the offering actions, which send the team.
  it.each(["editors", "teachingTeam.1.member"])(
    "says when a chosen member at %s no longer exists",
    async (path) => {
      mockPayload({
        update: vi
          .fn()
          .mockRejectedValue(
            new ValidationError([{ message: "This field has an invalid selection", path }]),
          ),
      })

      expect(await updateCourseEditors({ courseId: 4, editorIds: [8] })).toEqual({
        fieldErrors: {},
        formError: "A chosen member no longer exists. Remove them and try again.",
        ok: false,
      })
    },
  )

  // An editor who is not the owner reaches the action, and the course hooks refuse them.
  it("shows the hooks' refusal as the form error", async () => {
    mockPayload({
      update: vi
        .fn()
        .mockRejectedValue(new APIError("Only the owner or an admin can manage editors.", 403)),
    })

    expect(await updateCourseEditors({ courseId: 4, editorIds: [8] })).toEqual({
      formError: "Only the owner or an admin can manage editors.",
      ok: false,
    })
    expect(updateTag).not.toHaveBeenCalled()
  })

  it("logs an unexpected error and falls back to a generic message", async () => {
    const payload = mockPayload({ update: vi.fn().mockRejectedValue(new Error("db down")) })

    expect(await updateCourseEditors({ courseId: 4, editorIds: [8] })).toEqual({
      formError: "Could not save the editors. Try again.",
      ok: false,
    })
    expect(payload.logger.error).toHaveBeenCalled()
  })
})
