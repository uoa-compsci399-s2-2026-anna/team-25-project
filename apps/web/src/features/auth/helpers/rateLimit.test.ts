import type { sql } from "@payloadcms/db-postgres"
import { PgDialect } from "@payloadcms/db-postgres/drizzle/pg-core"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { releaseRateLimit, takeRateLimit } from "./rateLimit"

vi.mock("@/lib/payload/getPayloadClient", () => ({ getPayloadClient: vi.fn() }))

const TABLE = "rate_limits"
const dialect = new PgDialect()
const LIMITS = { cooldownSeconds: 120, max: 3, windowMinutes: 60 }

type SQL = ReturnType<typeof sql>

type Rows = Record<string, unknown>[]

// The database is mocked, so these cover the code around the SQL - what is bound,
// and how the result is read - not whether Postgres enforces the limits. That needs a
// real database, which the repo's tests don't have yet (see verificationCode.test.ts).

/** Answers each statement by its first keyword, so a test only sets the ones it cares about. */
const results: Record<"DELETE" | "INSERT" | "SELECT", Rows> = {
  DELETE: [],
  INSERT: [],
  SELECT: [],
}

const execute = vi.fn()
const remove = vi.fn()

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
  Object.assign(results, { DELETE: [], INSERT: [{ id: 1 }], SELECT: [] })

  execute.mockReset().mockImplementation(async (query: SQL) => {
    const keyword = dialect.sqlToQuery(query).sql.trim().split(/\s/)[0] as keyof typeof results
    return { rows: results[keyword] }
  })
  remove.mockReset().mockResolvedValue({ docs: [] })

  vi.mocked(getPayloadClient).mockResolvedValue({
    db: { drizzle: { execute }, tableNameMap: new Map([[TABLE, TABLE]]) },
    delete: remove,
  } as unknown as Awaited<ReturnType<typeof getPayloadClient>>)
})

describe("takeRateLimit", () => {
  it("counts the send when the limits allow it", async () => {
    await expect(takeRateLimit("reset:a.tui@example.ac.nz", LIMITS)).resolves.toEqual({
      ok: true,
    })
    expect(statement("INSERT").params[0]).toBe("reset:a.tui@example.ac.nz")
    expect(statements().some(({ sql }) => sql.trim().startsWith("SELECT"))).toBe(false)
  })

  it("checks and counts the send in one statement, with the caller's limits", async () => {
    await takeRateLimit("reset:a.tui@example.ac.nz", LIMITS)

    // One write only: a separate read then write would let simultaneous sends all pass.
    expect(statements().filter(({ sql }) => /^\s*(INSERT|UPDATE)/.test(sql))).toHaveLength(1)
    // Cooldown 120 s, at most 3 sends per 60 min window.
    expect(statement("INSERT").params).toEqual(expect.arrayContaining([120, 3, 60]))
  })

  it("clears out expired rows for every key before counting", async () => {
    await takeRateLimit("reset:a.tui@example.ac.nz", LIMITS)

    expect(statements()[0].sql.trim()).toMatch(/^DELETE/)
    // No key is bound, so expired rows for other keys go too.
    expect(statement("DELETE").params).toEqual([])
  })

  it("reports how long to wait when a limit refuses the send", async () => {
    results.INSERT = []
    results.SELECT = [{ retry_after: "104.3" }]

    await expect(takeRateLimit("reset:a.tui@example.ac.nz", LIMITS)).resolves.toEqual({
      ok: false,
      retryAfterSeconds: 105,
    })
    expect(statement("SELECT").params).toContain("reset:a.tui@example.ac.nz")
  })

  it("never asks the caller to wait less than a second", async () => {
    results.INSERT = []
    results.SELECT = [{ retry_after: "-0.2" }]

    await expect(takeRateLimit("reset:a.tui@example.ac.nz", LIMITS)).resolves.toEqual({
      ok: false,
      retryAfterSeconds: 1,
    })
  })

  it("still refuses when the row disappears before the wait is read", async () => {
    results.INSERT = []
    results.SELECT = []

    await expect(takeRateLimit("reset:a.tui@example.ac.nz", LIMITS)).resolves.toEqual({
      ok: false,
      retryAfterSeconds: 1,
    })
  })
})

describe("releaseRateLimit", () => {
  it("deletes the row for the key", async () => {
    await releaseRateLimit("reset:a.tui@example.ac.nz")

    expect(remove).toHaveBeenCalledWith(
      expect.objectContaining({ where: { key: { equals: "reset:a.tui@example.ac.nz" } } }),
    )
  })
})
