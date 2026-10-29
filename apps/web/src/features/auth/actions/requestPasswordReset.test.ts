import { after } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { releaseRateLimit, takeRateLimit } from "../helpers/rateLimit"
import { requestPasswordReset } from "./requestPasswordReset"

vi.mock("next/server", () => ({ after: vi.fn() }))
vi.mock("@/lib/payload/getPayloadClient", () => ({ getPayloadClient: vi.fn() }))
vi.mock("@/lib/siteUrl", () => ({ siteUrl: new URL("https://ccca.example") }))
vi.mock("../helpers/rateLimit", () => ({ releaseRateLimit: vi.fn(), takeRateLimit: vi.fn() }))

const mockPayload = (overrides: Record<string, unknown> = {}) => {
  const payload = {
    email: { name: "nodemailer" },
    forgotPassword: vi.fn().mockResolvedValue("reset-token"),
    logger: { error: vi.fn() },
    sendEmail: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
  // biome-ignore lint/suspicious/noExplicitAny: minimal Payload mock, only the operations the action calls
  vi.mocked(getPayloadClient).mockResolvedValue(payload as any)
  return payload
}

// Runs the work the action left for after the response.
const runAfter = () =>
  Promise.all(vi.mocked(after).mock.calls.map(([task]) => (task as () => Promise<void>)()))

describe("requestPasswordReset", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(takeRateLimit).mockResolvedValue({ ok: true })
    vi.mocked(releaseRateLimit).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("emails a link to the reset page on the public site", async () => {
    const payload = mockPayload()

    await expect(requestPasswordReset({ email: "a.tui@uni.ac.nz" })).resolves.toEqual({ ok: true })
    // Nothing is sent until the response has gone.
    expect(payload.forgotPassword).not.toHaveBeenCalled()
    await runAfter()
    expect(payload.forgotPassword).toHaveBeenCalledWith(
      expect.objectContaining({
        context: { disableRevalidate: true, skipDomainCheck: true },
        data: { email: "a.tui@uni.ac.nz" },
        disableEmail: true,
      }),
    )
    const sent = payload.sendEmail.mock.calls[0][0]
    expect(sent.to).toBe("a.tui@uni.ac.nz")
    expect(sent.text).toContain("https://ccca.example/reset-password?token=reset-token")
    expect(sent.html).toContain("https://ccca.example/reset-password?token=reset-token")
  })

  it("answers the same for an address with no account, and still counts the send", async () => {
    const payload = mockPayload({ forgotPassword: vi.fn().mockResolvedValue(null) })

    await expect(requestPasswordReset({ email: "nobody@uni.ac.nz" })).resolves.toEqual({
      ok: true,
    })
    await runAfter()
    expect(takeRateLimit).toHaveBeenCalledWith("reset:nobody@uni.ac.nz", expect.anything())
    expect(payload.sendEmail).not.toHaveBeenCalled()
  })

  it("limits by the address however it's typed, at 2 min apart and 3 an hour", async () => {
    mockPayload()

    await requestPasswordReset({ email: "A.Tui@Uni.ac.NZ" })

    expect(takeRateLimit).toHaveBeenCalledWith("reset:a.tui@uni.ac.nz", {
      cooldownSeconds: 120,
      max: 3,
      windowMinutes: 60,
    })
  })

  it("says how long to wait when the limit refuses, without sending", async () => {
    mockPayload()
    vi.mocked(takeRateLimit).mockResolvedValue({ ok: false, retryAfterSeconds: 95 })

    await expect(requestPasswordReset({ email: "a.tui@uni.ac.nz" })).resolves.toEqual({
      formError: "You can ask for another email in 2 minutes.",
      ok: false,
      retryAfterSeconds: 95,
    })
    expect(after).not.toHaveBeenCalled()
  })

  it("answers ok when the email fails, logging it and giving the send back", async () => {
    const payload = mockPayload({ sendEmail: vi.fn().mockRejectedValue(new Error("SES down")) })

    await expect(requestPasswordReset({ email: "a.tui@uni.ac.nz" })).resolves.toEqual({ ok: true })
    await runAfter()
    expect(releaseRateLimit).toHaveBeenCalledWith("reset:a.tui@uni.ac.nz")
    expect(payload.logger.error).toHaveBeenCalled()
  })

  it("keeps the send counted when the limit itself fails", async () => {
    mockPayload()
    vi.mocked(takeRateLimit).mockRejectedValue(new Error("db down"))

    await expect(requestPasswordReset({ email: "a.tui@uni.ac.nz" })).rejects.toThrow("db down")
    expect(releaseRateLimit).not.toHaveBeenCalled()
    expect(after).not.toHaveBeenCalled()
  })

  it("rejects an invalid email before touching the limit", async () => {
    mockPayload()

    await expect(requestPasswordReset({ email: "not-an-email" })).resolves.toEqual({
      fieldErrors: { email: "Enter a valid email address" },
      ok: false,
    })
    expect(takeRateLimit).not.toHaveBeenCalled()
  })

  it("refuses in production when no email adapter is set up", async () => {
    vi.stubEnv("NODE_ENV", "production")
    const payload = mockPayload({ email: { name: "console" } })

    await expect(requestPasswordReset({ email: "a.tui@uni.ac.nz" })).resolves.toEqual({
      formError: "We couldn't send the email right now. Try again.",
      ok: false,
    })
    expect(payload.forgotPassword).not.toHaveBeenCalled()
  })
})
