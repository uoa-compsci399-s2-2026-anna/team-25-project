import { login } from "@payloadcms/next/auth"
import { LockedAuth } from "payload"
import { afterEach, describe, expect, it, vi } from "vitest"
import { loginAction } from "./auth"

vi.mock("@payloadcms/next/auth", () => ({ login: vi.fn() }))
vi.mock("@payload-config", () => ({ default: {} }))

describe("loginAction", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("returns success with the login result when credentials are valid", async () => {
    const user = { id: "1", email: "member@uni.edu" }
    vi.mocked(login).mockResolvedValue({ user } as any)

    const result = await loginAction("member@uni.edu", "password123")

    expect(result).toEqual({ success: true, result: { user } })
  })

  it("calls login with the members collection and given credentials", async () => {
    vi.mocked(login).mockResolvedValue({} as any)

    await loginAction("member@uni.edu", "password123")

    expect(login).toHaveBeenCalledWith({
      collection: "members",
      config: {},
      email: "member@uni.edu",
      password: "password123",
    })
  })

  it("returns a generic failure message when login throws", async () => {
    vi.mocked(login).mockRejectedValue(new Error("Invalid credentials"))

    const result = await loginAction("member@uni.edu", "wrong-password")

    expect(result).toEqual({ success: false, message: "Invalid email or password" })
  })

  it("returns the account-lockout message when login throws LockedAuth", async () => {
    const lockedError = new LockedAuth()
    vi.mocked(login).mockRejectedValue(lockedError)

    const result = await loginAction("member@uni.edu", "password123")

    expect(result).toEqual({ success: false, message: lockedError.message })
  })
})
