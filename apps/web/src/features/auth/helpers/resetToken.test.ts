import { beforeEach, describe, expect, it, vi } from "vitest"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { isResetTokenLive } from "./resetToken"

vi.mock("next/server", () => ({ connection: vi.fn() }))
vi.mock("@/lib/payload/getPayloadClient", () => ({ getPayloadClient: vi.fn() }))

const count = vi.fn()

beforeEach(() => {
  count.mockReset()
  // biome-ignore lint/suspicious/noExplicitAny: minimal Payload mock, only count is used
  vi.mocked(getPayloadClient).mockResolvedValue({ count } as any)
})

describe("isResetTokenLive", () => {
  it("is live when a member holds the token and it hasn't expired", async () => {
    vi.useFakeTimers({ now: new Date("2026-10-26T01:00:00.000Z") })
    count.mockResolvedValue({ totalDocs: 1 })

    await expect(isResetTokenLive("reset-token")).resolves.toBe(true)
    expect(count).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "members",
        overrideAccess: true,
        where: {
          and: [
            { resetPasswordToken: { equals: "reset-token" } },
            { resetPasswordExpiration: { greater_than: "2026-10-26T01:00:00.000Z" } },
          ],
        },
      }),
    )
    vi.useRealTimers()
  })

  it("is dead when no member holds an unexpired copy", async () => {
    count.mockResolvedValue({ totalDocs: 0 })

    await expect(isResetTokenLive("reset-token")).resolves.toBe(false)
  })
})
