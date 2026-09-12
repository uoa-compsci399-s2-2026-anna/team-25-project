import { logout } from "@payloadcms/next/auth"
import { APIError } from "payload"
import { afterEach, describe, expect, it, vi } from "vitest"
import { logoutAction } from "./logout"

vi.mock("@payloadcms/next/auth", () => ({ logout: vi.fn() }))
vi.mock("@payload-config", () => ({ default: {} }))

describe("logoutAction", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("returns success when logout resolves", async () => {
    vi.mocked(logout).mockResolvedValue(undefined)

    const result = await logoutAction()

    expect(result).toEqual({ success: true })
  })

  it("calls logout with allSessions and the payload config", async () => {
    vi.mocked(logout).mockResolvedValue(undefined)

    await logoutAction()

    expect(logout).toHaveBeenCalledWith({ allSessions: true, config: {} })
  })

  it("returns a generic failure message when logout throws an unexpected error", async () => {
    vi.mocked(logout).mockRejectedValue(new Error("boom"))

    const result = await logoutAction()

    expect(result).toEqual({
      success: false,
      message: "We couldn't log you out. Try again later.",
    })
  })

  it("returns the session-ended message when logout throws APIError", async () => {
    vi.mocked(logout).mockRejectedValue(new APIError("No User", 400))

    const result = await logoutAction()

    expect(result).toEqual({
      success: false,
      message: "Your session has already ended. Refresh the page and try again.",
    })
  })
})
