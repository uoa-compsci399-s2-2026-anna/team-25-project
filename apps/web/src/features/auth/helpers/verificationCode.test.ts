import type { sql } from "@payloadcms/db-postgres"
import { PgDialect } from "@payloadcms/db-postgres/drizzle/pg-core"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { checkCode, consumeCode, issueCode } from "./verificationCode"

vi.mock("@/lib/payload/getPayloadClient", () => ({ getPayloadClient: vi.fn() }))

const TABLE = "email_verification_codes"
const dialect = new PgDialect()

type SQL = ReturnType<typeof sql>

type Rows = Record<string, unknown>[]

/** Answers each statement by its first keyword, so a test only sets the ones it cares about. */
const results: Record<"DELETE" | "INSERT" | "SELECT" | "UPDATE", Rows> = {
  DELETE: [],
  INSERT: [],
  SELECT: [],
  UPDATE: [],
}

const execute = vi.fn()
const remove = vi.fn()
const sendEmail = vi.fn()
const logError = vi.fn()

// The statements as Postgres receives them: SQL text and bound parameters.
const statements = () =>
  execute.mock.calls.map(([query]) => dialect.sqlToQuery(query as SQL)) as {
    sql: string
    params: unknown[]
  }[]

const statement = (keyword: keyof typeof results) => {
  const found = statements().find((query) => query.sql.trim().startsWith(keyword))
  if (!found) throw new Error(`No ${keyword} statement was run`)
  return found
}

beforeEach(() => {
  vi.stubEnv("PAYLOAD_SECRET", "test-secret")
  Object.assign(results, { DELETE: [], INSERT: [{ id: 1 }], SELECT: [], UPDATE: [] })

  execute.mockReset().mockImplementation(async (query: SQL) => {
    const keyword = dialect.sqlToQuery(query).sql.trim().split(/\s/)[0] as keyof typeof results
    return { rows: results[keyword] }
  })
  remove.mockReset().mockResolvedValue({ docs: [] })
  sendEmail.mockReset().mockResolvedValue(undefined)
  logError.mockReset()

  vi.mocked(getPayloadClient).mockResolvedValue({
    db: { drizzle: { execute }, tableNameMap: new Map([[TABLE, TABLE]]) },
    delete: remove,
    logger: { error: logError },
    sendEmail,
  } as unknown as Awaited<ReturnType<typeof getPayloadClient>>)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

/** Issues a code and returns what was emailed and the hash that was stored. */
const issue = async (email = "a.tui@example.ac.nz") => {
  await issueCode(email)
  const code = /^(\d{6}) is your CCCA verification code$/.exec(sendEmail.mock.calls[0][0].subject)
  const [, hash] = statement("INSERT").params
  return { code: code?.[1] ?? "", hash: hash as string }
}

describe("issueCode", () => {
  it("emails a six-digit code and stores only its hash", async () => {
    const { code, hash } = await issue()

    expect(code).toMatch(/^\d{6}$/)
    expect(sendEmail.mock.calls[0][0].text).toContain(code)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(statement("INSERT").params).not.toContain(code)
  })

  it("stores the email the way Payload stores member emails", async () => {
    await issueCode("  A.Tui@Example.ac.NZ ")

    expect(statement("INSERT").params[0]).toBe("a.tui@example.ac.nz")
    expect(sendEmail.mock.calls[0][0].to).toBe("a.tui@example.ac.nz")
  })

  it("keeps one row per email and checks the limits in the same statement", async () => {
    await issueCode("a.tui@example.ac.nz")
    const { sql, params } = statement("INSERT")

    expect(sql).toContain("ON CONFLICT (email) DO UPDATE")
    expect(sql).toContain("attempts = 0")
    expect(sql).toMatch(/WHERE "email_verification_codes"\.sent_at <= now\(\) - make_interval/)
    expect(sql).toContain('"email_verification_codes".sends_in_window < ')
    // TTL 15 min, resend after 60 s, at most 5 sends per 60 min window.
    expect(params).toEqual(expect.arrayContaining([15, 60, 5]))
  })

  it("clears out rows whose code and send window have both run out", async () => {
    await issueCode("a.tui@example.ac.nz")
    const { sql } = statement("DELETE")

    expect(sql).toContain("expires_at < now()")
    expect(sql).toContain("window_started_at <= now() - make_interval")
  })

  it("reports how long to wait when a limit refuses the new code", async () => {
    results.INSERT = []
    results.SELECT = [{ retry_after: "39.2" }]

    await expect(issueCode("a.tui@example.ac.nz")).resolves.toEqual({
      ok: false,
      error: "cooldown",
      retryAfterSeconds: 40,
    })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it("removes the stored code when the email can't be sent", async () => {
    results.INSERT = [{ id: 9 }]
    sendEmail.mockRejectedValue(new Error("SES rejected the message"))

    await expect(issueCode("a.tui@example.ac.nz")).resolves.toEqual({
      ok: false,
      error: "send-failed",
    })
    expect(remove).toHaveBeenCalledWith(expect.objectContaining({ id: 9 }))
    expect(logError).toHaveBeenCalled()
  })

  it("refuses to hash without the server secret", async () => {
    vi.stubEnv("PAYLOAD_SECRET", "")

    await expect(issueCode("a.tui@example.ac.nz")).rejects.toThrow("PAYLOAD_SECRET is not set")
    expect(sendEmail).not.toHaveBeenCalled()
  })
})

describe("checkCode", () => {
  it("accepts the code that was emailed", async () => {
    const { code, hash } = await issue()
    results.UPDATE = [{ code_hash: hash }]

    await expect(checkCode("a.tui@example.ac.nz", code)).resolves.toBe("ok")
  })

  it("accepts the email in any case", async () => {
    const { code, hash } = await issue()
    results.UPDATE = [{ code_hash: hash }]

    await expect(checkCode("A.Tui@Example.ac.nz", code)).resolves.toBe("ok")
  })

  it("rejects a wrong code", async () => {
    const { code, hash } = await issue()
    results.UPDATE = [{ code_hash: hash }]
    const wrong = code === "000000" ? "000001" : "000000"

    await expect(checkCode("a.tui@example.ac.nz", wrong)).resolves.toBe("invalid")
  })

  it("rejects a code issued for a different email", async () => {
    const { code, hash } = await issue("a.tui@example.ac.nz")
    results.UPDATE = [{ code_hash: hash }]

    await expect(checkCode("someone.else@example.ac.nz", code)).resolves.toBe("invalid")
  })

  it("counts the guess only while the code is unexpired and under 5 attempts", async () => {
    await checkCode("a.tui@example.ac.nz", "123456")
    const { sql, params } = statement("UPDATE")

    expect(sql).toContain("attempts = attempts + 1")
    expect(sql).toContain("expires_at > now()")
    expect(sql).toContain("attempts < $2")
    expect(params).toEqual(["a.tui@example.ac.nz", 5])
  })

  it("reports a code that is out of tries as locked", async () => {
    results.SELECT = [{ "?column?": 1 }]

    await expect(checkCode("a.tui@example.ac.nz", "123456")).resolves.toBe("locked")
  })

  it("reports a missing or timed-out code as expired", async () => {
    await expect(checkCode("a.tui@example.ac.nz", "123456")).resolves.toBe("expired")
    expect(statement("SELECT").sql).toContain("expires_at > now()")
  })
})

describe("consumeCode", () => {
  it("deletes the code for the email", async () => {
    await consumeCode(" A.Tui@example.ac.nz")

    expect(remove).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: { equals: "a.tui@example.ac.nz" } } }),
    )
  })
})
