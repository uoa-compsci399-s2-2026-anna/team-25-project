import { headers } from "next/headers"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "./getCurrentUser"
import { getPayloadClient } from "./getPayloadClient"

vi.mock("next/headers", () => ({ headers: vi.fn() }))
vi.mock("./getPayloadClient", () => ({ getPayloadClient: vi.fn() }))

const mockAuth = (user: unknown) => {
  vi.mocked(getPayloadClient).mockResolvedValue({
    auth: vi.fn().mockResolvedValue({ user }),
    // biome-ignore lint/suspicious/noExplicitAny: minimal Payload mock, only .auth is used
  } as any)
}

describe("getCurrentUser", () => {
  beforeEach(() => {
    vi.mocked(headers).mockResolvedValue(new Headers())
  })

  it("returns collection: null when nobody is signed in", async () => {
    mockAuth(null)
    await expect(getCurrentUser()).resolves.toEqual({ collection: null, user: null })
  })

  it("returns the admin collection for an admin user", async () => {
    const user = { id: 1, collection: "admin" }
    mockAuth(user)
    await expect(getCurrentUser()).resolves.toEqual({ collection: "admin", user })
  })

  it("returns the members collection for a member user", async () => {
    const user = { id: 1, collection: "members" }
    mockAuth(user)
    await expect(getCurrentUser()).resolves.toEqual({ collection: "members", user })
  })
})
