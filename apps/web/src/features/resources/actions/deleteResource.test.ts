import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateTag } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { deleteResource } from "./deleteResource"

vi.mock("next/cache", () => ({ updateTag: vi.fn() }))
vi.mock("@/lib/payload/getPayloadClient", () => ({ getPayloadClient: vi.fn() }))
vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))

const member = { collection: "members" as const, user: { id: 7 } }

const DELETE_FAILED = "Could not delete this resource. Try again."

const mockPayload = (overrides: Record<string, unknown> = {}) => {
  const payload = {
    delete: vi.fn().mockResolvedValue({}),
    logger: { error: vi.fn() },
    ...overrides,
  }
  // biome-ignore lint/suspicious/noExplicitAny: minimal Payload mock, only the operations the action calls
  vi.mocked(getPayloadClient).mockResolvedValue(payload as any)
  return payload
}

describe("deleteResource", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the action reads
    vi.mocked(getCurrentUser).mockResolvedValue(member as any)
  })

  it.each([Number.NaN, 1.5])("refuses an id that isn't an integer (%s)", async (id) => {
    const payload = mockPayload()

    const result = await deleteResource(id)

    expect(result).toEqual({ formError: DELETE_FAILED, ok: false })
    expect(payload.delete).not.toHaveBeenCalled()
  })

  it("refuses when nobody is signed in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })
    const payload = mockPayload()

    const result = await deleteResource(3)

    expect(result).toEqual({ formError: "Sign in to delete this resource.", ok: false })
    expect(payload.delete).not.toHaveBeenCalled()
  })

  it("leaves the owner/admin check to Payload's access rule", async () => {
    const payload = mockPayload()

    await deleteResource(3)

    expect(payload.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "resources",
        id: 3,
        overrideAccess: false,
        user: member.user,
      }),
    )
  })

  it.each([
    ["Forbidden", Object.assign(new Error("Forbidden"), { status: 403 })],
    ["NotFound", Object.assign(new Error("Not Found"), { status: 404 })],
  ])(
    "gives one message for %s, so it doesn't reveal whether the resource exists",
    async (_, error) => {
      const payload = mockPayload({ delete: vi.fn().mockRejectedValue(error) })

      const result = await deleteResource(3)

      expect(result).toEqual({ formError: DELETE_FAILED, ok: false })
      expect(payload.logger.error).toHaveBeenCalled()
      expect(updateTag).not.toHaveBeenCalled()
    },
  )

  it("refreshes every list the resource was on after a delete", async () => {
    mockPayload()

    const result = await deleteResource(3)

    expect(result).toEqual({ ok: true })
    expect(updateTag).toHaveBeenCalledWith(QueryKeys.RESOURCES.ROOT)
    expect(updateTag).toHaveBeenCalledWith(QueryKeys.RESOURCES.ID(3))
  })

  it("still succeeds when the cache update fails after the delete", async () => {
    const payload = mockPayload()
    vi.mocked(updateTag).mockImplementationOnce(() => {
      throw new Error("cache down")
    })

    expect(await deleteResource(3)).toEqual({ ok: true })
    expect(payload.logger.error).toHaveBeenCalled()
  })
})
