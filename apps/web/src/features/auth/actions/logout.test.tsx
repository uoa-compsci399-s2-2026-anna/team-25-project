import { logout } from "@payloadcms/next/auth"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { logoutAction } from "./logout"

vi.mock("@payloadcms/next/auth", () => ({ logout: vi.fn() }))
vi.mock("@payload-config", () => ({ default: {} }))
vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))

const loggedInSession = {
  collection: "members",
  user: { id: "1" },
}

describe("logoutAction", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("returns success with the server's message when logout resolves", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: minimal session mock
    vi.mocked(getCurrentUser).mockResolvedValue(loggedInSession as any)
    vi.mocked(logout).mockResolvedValue({ success: true, message: "User logged out successfully" })

    const result = await logoutAction()

    expect(result).toEqual({ success: true, message: "User logged out successfully" })
  })

  it("calls logout with allSessions and the payload config when a session exists", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: minimal session mock
    vi.mocked(getCurrentUser).mockResolvedValue(loggedInSession as any)
    vi.mocked(logout).mockResolvedValue({ success: true, message: "User logged out successfully" })

    await logoutAction()

    expect(logout).toHaveBeenCalledWith({ allSessions: true, config: {} })
  })

  it("returns a failure message when logout resolves unsuccessfully", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: minimal session mock
    vi.mocked(getCurrentUser).mockResolvedValue(loggedInSession as any)
    vi.mocked(logout).mockResolvedValue({ success: false, message: "nope" })

    const result = await logoutAction()

    expect(result).toEqual({
      success: false,
      message: "We couldn't log you out. Try again later.",
    })
  })

  it("returns a no-session message without calling logout when there is no current user", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })

    const result = await logoutAction()

    expect(result).toEqual({ success: false, message: "No session found" })
    expect(logout).not.toHaveBeenCalled()
  })

  it("returns a generic failure message when logout throws an unexpected error", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: minimal session mock
    vi.mocked(getCurrentUser).mockResolvedValue(loggedInSession as any)
    vi.mocked(logout).mockRejectedValue(new Error("boom"))

    const result = await logoutAction()

    expect(result).toEqual({
      success: false,
      message: "We couldn't log you out. Try again later.",
    })
  })

  it("returns a generic failure message when getCurrentUser throws", async () => {
    vi.mocked(getCurrentUser).mockRejectedValue(new Error("boom"))

    const result = await logoutAction()

    expect(result).toEqual({
      success: false,
      message: "We couldn't log you out. Try again later.",
    })
  })
})
