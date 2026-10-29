import type { sql } from "@payloadcms/db-postgres"
import { PgDialect } from "@payloadcms/db-postgres/drizzle/pg-core"
import { cookies } from "next/headers"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { resetPassword } from "./resetPassword"

// A local stand-in so `instanceof` still discriminates: the action and this
// test both resolve to this same class. Declared via vi.hoisted because
// vi.mock's factory is hoisted above ordinary top-level declarations.
const { APIError } = vi.hoisted(() => {
  class APIError extends Error {
    status: number
    constructor(message: string, status: number) {
      super(message)
      this.status = status
    }
  }
  return { APIError }
})

vi.mock("payload", () => ({ APIError }))
vi.mock("payload/shared", () => ({
  generatePayloadCookie: () => ({
    httpOnly: true,
    name: "payload-token",
    path: "/",
    sameSite: "Lax",
    secure: false,
    value: "signed-token",
  }),
}))
vi.mock("next/headers", () => ({ cookies: vi.fn() }))
vi.mock("@/lib/payload/getPayloadClient", () => ({ getPayloadClient: vi.fn() }))

const execute = vi.fn()
vi.mock("@/lib/payload/db", () => ({
  getDbInstance: () => ({ execute }),
  tableName: () => "members_sessions",
}))

// The statement as Postgres receives it: SQL text and bound parameters.
const deleteStatement = () =>
  new PgDialect().sqlToQuery(execute.mock.calls[0][0] as ReturnType<typeof sql>)

/** A JWT whose claims name session `sid`; only the claims are read. */
const tokenFor = (sid: string) =>
  `header.${Buffer.from(JSON.stringify({ sid })).toString("base64url")}.signature`

const NEW_SESSION_ID = "new-session"

const valid = { password: "NewPassword1!", token: "reset-token" }

const setCookie = vi.fn()

const mockPayload = (overrides: Record<string, unknown> = {}) => {
  const payload = {
    collections: { members: { config: { auth: {} } } },
    config: { cookiePrefix: "payload" },
    logger: { error: vi.fn() },
    resetPassword: vi.fn().mockResolvedValue({
      token: tokenFor(NEW_SESSION_ID),
      user: { id: 7 },
    }),
    db: { updateOne: vi.fn().mockResolvedValue(null) },
    ...overrides,
  }
  // biome-ignore lint/suspicious/noExplicitAny: minimal Payload mock, only the operations the action calls
  vi.mocked(getPayloadClient).mockResolvedValue(payload as any)
  return payload
}

const INVALID_LINK = {
  formError: "This reset link has expired or has already been used.",
  invalidToken: true,
  ok: false,
}

describe("resetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(cookies).mockResolvedValue({ set: setCookie } as never)
    execute.mockResolvedValue({ rows: [] })
  })

  it("sets the new password and signs the member in", async () => {
    const payload = mockPayload()

    await expect(resetPassword(valid)).resolves.toEqual({ ok: true })
    expect(payload.resetPassword).toHaveBeenCalledWith(
      expect.objectContaining({ collection: "members", data: valid }),
    )
    expect(setCookie).toHaveBeenCalledWith("payload-token", "signed-token", expect.anything())
  })

  it("ends every other session and lifts any lockout, without rewriting the member", async () => {
    const payload = mockPayload()

    await resetPassword(valid)

    expect(payload.db.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ data: { lockUntil: null, loginAttempts: 0 }, id: 7 }),
    )
    const { params, sql } = deleteStatement()
    expect(sql).toContain('DELETE FROM "members_sessions"')
    expect(params).toEqual([7, NEW_SESSION_ID])
  })

  it("reports an error, ending no sessions, when the token names no session", async () => {
    const payload = mockPayload({
      resetPassword: vi.fn().mockResolvedValue({
        token: `header.${Buffer.from("{}").toString("base64url")}.signature`,
        user: { id: 7 },
      }),
    })

    await expect(resetPassword(valid)).resolves.toEqual({
      formError:
        "Your password was changed, but we couldn't sign you out on your other devices. Log in with your new password.",
      ok: false,
    })
    expect(payload.db.updateOne).toHaveBeenCalled()
    expect(execute).not.toHaveBeenCalled()
    expect(setCookie).not.toHaveBeenCalled()
  })

  it("rejects a password sign-up would refuse, without using the link", async () => {
    const payload = mockPayload()

    await expect(resetPassword({ ...valid, password: "short" })).resolves.toEqual({
      fieldErrors: { password: "Password must be at least 8 characters" },
      ok: false,
    })
    expect(payload.resetPassword).not.toHaveBeenCalled()
  })

  it("treats a missing token as a dead link", async () => {
    mockPayload()

    await expect(resetPassword({ ...valid, token: "" })).resolves.toEqual(INVALID_LINK)
  })

  it("reports an expired or used link so the form can offer a new one", async () => {
    mockPayload({
      resetPassword: vi
        .fn()
        .mockRejectedValue(new APIError("Token is either invalid or has expired.", 403)),
    })

    await expect(resetPassword(valid)).resolves.toEqual(INVALID_LINK)
    expect(setCookie).not.toHaveBeenCalled()
  })

  it("reports any other failure as a retryable form error", async () => {
    const payload = mockPayload({
      resetPassword: vi.fn().mockRejectedValue(new Error("connection lost")),
    })

    await expect(resetPassword(valid)).resolves.toEqual({
      formError: "We couldn't reset your password. Try again.",
      ok: false,
    })
    expect(payload.logger.error).toHaveBeenCalled()
  })

  it("reports an error, without signing in, when ending other sessions fails", async () => {
    const payload = mockPayload()
    execute.mockRejectedValue(new Error("db down"))

    await expect(resetPassword(valid)).resolves.toEqual({
      formError:
        "Your password was changed, but we couldn't sign you out on your other devices. Log in with your new password.",
      ok: false,
    })
    expect(payload.logger.error).toHaveBeenCalled()
    expect(setCookie).not.toHaveBeenCalled()
  })

  it("tells the member to log in when the session can't be started", async () => {
    mockPayload()
    vi.mocked(cookies).mockRejectedValue(new Error("no request"))

    await expect(resetPassword(valid)).resolves.toEqual({
      formError: "Your password was changed. Log in with your new password.",
      ok: false,
    })
  })
})
