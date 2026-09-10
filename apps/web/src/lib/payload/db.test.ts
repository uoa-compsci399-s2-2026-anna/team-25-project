import type { PayloadRequest } from "payload"
import { describe, expect, it } from "vitest"
import { getTransactionDbInstance, tableName } from "./db"
import { Slugs } from "./slugs"

const request = (db: unknown) => ({ payload: { db } }) as unknown as PayloadRequest

const withTables = (entries: [string, string][] = []) =>
  request({ tableNameMap: new Map(entries), sessions: {} })

describe("tableName", () => {
  it("returns the name the adapter mapped the slug to", () => {
    const req = withTables([["course_versions", "renamed_versions"]])
    expect(tableName(req, Slugs.Collections.COURSE_VERSIONS)).toBe("renamed_versions")
  })

  it("throws instead of guessing when the slug is not mapped", () => {
    expect(() => tableName(withTables(), Slugs.Collections.COURSES)).toThrow("No table is mapped")
  })

  it.each([
    [Slugs.Collections.COURSES, "courses"],
    [Slugs.Collections.COURSE_VERSIONS, "course_versions"],
    [Slugs.Collections.INSTITUTIONS, "institutions"],
  ])("keys %s as %s", (slug, key) => {
    expect(tableName(withTables([[key, key]]), slug)).toBe(key)
  })
})

describe("getTransactionDbInstance", () => {
  it("returns the handle bound to the request's transaction", async () => {
    const db = { execute: () => {} }
    const req = request({ tableNameMap: new Map(), sessions: { "7": { db } } })
    await expect(
      getTransactionDbInstance({ ...req, transactionID: 7 } as PayloadRequest),
    ).resolves.toBe(db)
  })

  it("refuses to fall back to the pool when no transaction is open", async () => {
    await expect(getTransactionDbInstance(withTables())).rejects.toThrow(
      "requires a database transaction",
    )
  })

  it("throws when the session has already been resolved", async () => {
    const req = { ...withTables(), transactionID: 7 } as PayloadRequest
    await expect(getTransactionDbInstance(req)).rejects.toThrow("transaction is unavailable")
  })
})
