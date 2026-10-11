import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { isOwnProfile } from "./members.ownership"

vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))

describe("isOwnProfile", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset()
  })

  it("is true for the member themselves", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: "members", user: { id: 7 } } as never)
    expect(await isOwnProfile(7)).toBe(true)
  })

  it("is false for another member", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: "members", user: { id: 8 } } as never)
    expect(await isOwnProfile(7)).toBe(false)
  })

  it("is false for an admin whose id happens to match", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: "admin", user: { id: 7 } } as never)
    expect(await isOwnProfile(7)).toBe(false)
  })

  it("is false when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })
    expect(await isOwnProfile(7)).toBe(false)
  })
})
