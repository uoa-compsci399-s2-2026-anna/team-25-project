import type { PayloadRequest } from "payload"
import { describe, expect, it, vi } from "vitest"
import { lockDocument } from "./lock"
import { Slugs } from "./slugs"

const course = { id: 1, code: "SE 101" }

const request = ({
  rows = [{ id: 1 }] as unknown[],
  transactionID = 7 as unknown,
  tables = [["courses", "courses"]] as [string, string][],
} = {}) => {
  const execute = vi.fn().mockResolvedValue({ rows })
  const findByID = vi.fn().mockResolvedValue(course)

  const warn = vi.fn()

  const req = {
    transactionID,
    user: { id: 42 },
    payload: {
      db: { tableNameMap: new Map(tables), sessions: { "7": { db: { execute } } } },
      findByID,
      logger: { warn },
    },
  } as unknown as PayloadRequest

  return { req, execute, findByID, warn }
}

// `execute` is called for the timeout setting first, then the lock itself.
const lockStatement = (execute: ReturnType<typeof vi.fn>) =>
  JSON.stringify(execute.mock.calls.at(-1)?.[0])

describe("lockDocument", () => {
  it("returns the document read under the lock", async () => {
    const { req, findByID } = request()

    await expect(lockDocument(req, Slugs.Collections.COURSES, 1)).resolves.toBe(course)
    expect(findByID).toHaveBeenCalledWith({
      collection: Slugs.Collections.COURSES,
      id: 1,
      depth: 0,
      req,
      overrideAccess: true,
    })
  })

  // The lock is what makes the read safe, so the read must never run without it.
  it("locks the row before reading it", async () => {
    const order: string[] = []
    const { req, execute, findByID } = request()
    execute.mockImplementation(async (statement: unknown) => {
      if (JSON.stringify(statement).includes("FOR UPDATE")) order.push("lock")
      return { rows: [{ id: 1 }] }
    })
    findByID.mockImplementation(async () => {
      order.push("read")
      return course
    })

    await lockDocument(req, Slugs.Collections.COURSES, 1)
    expect(order).toEqual(["lock", "read"])
  })

  it("locks the table the adapter mapped the collection to", async () => {
    const { req, execute } = request({ tables: [["courses", "renamed_courses"]] })

    await lockDocument(req, Slugs.Collections.COURSES, 1)
    expect(lockStatement(execute)).toContain("renamed_courses")
  })

  // Without FOR UPDATE the statement is a plain read: it takes no lock at all, and
  // every guarantee built on it — lost-update protection on publication, the re-read
  // in assertVersionDeletable — silently disappears.
  it("takes the row lock FOR UPDATE against the requested ID", async () => {
    const { req, execute } = request()

    await lockDocument(req, Slugs.Collections.COURSES, 9)

    const statement = lockStatement(execute)
    expect(statement).toContain("FOR UPDATE")
    expect(statement).toContain("9")
  })

  // An unbounded wait blocks the request and holds its pool connection, so the
  // wait is bounded and the contention is reported instead.
  it("bounds the wait before taking the lock", async () => {
    const { req, execute } = request()

    await lockDocument(req, Slugs.Collections.COURSES, 1)
    expect(JSON.stringify(execute.mock.calls[0][0])).toContain("lock_timeout")
  })

  it("reports contention when the lock times out", async () => {
    const { req, execute, findByID, warn } = request()
    execute.mockImplementation(async (statement: unknown) => {
      if (!JSON.stringify(statement).includes("FOR UPDATE")) return { rows: [] }
      throw Object.assign(new Error("canceling statement due to lock timeout"), { code: "55P03" })
    })

    await expect(lockDocument(req, Slugs.Collections.COURSES, 1)).rejects.toThrow(
      "Someone else is saving this courses record.",
    )
    expect(findByID).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledWith(
      { collection: Slugs.Collections.COURSES, id: 1, userID: 42 },
      expect.stringContaining("row lock"),
    )
  })

  // Only the timeout is translated. Anything else is a real fault and must surface.
  it("propagates a lock failure that is not a timeout", async () => {
    const { req, execute } = request()
    execute.mockImplementation(async (statement: unknown) => {
      if (!JSON.stringify(statement).includes("FOR UPDATE")) return { rows: [] }
      throw Object.assign(new Error("connection terminated"), { code: "08006" })
    })

    await expect(lockDocument(req, Slugs.Collections.COURSES, 1)).rejects.toThrow(
      "connection terminated",
    )
  })

  it.each([undefined, 0])("refuses to lock without an ID: %j", async (id) => {
    const { req, execute } = request()

    await expect(lockDocument(req, Slugs.Collections.COURSES, id)).rejects.toThrow(
      "A courses record is required.",
    )
    expect(execute).not.toHaveBeenCalled()
  })

  // A row that does not exist locks nothing, so the miss is reported here rather
  // than left to a read that may have errors disabled.
  it("reports a missing row at the lock, not at the read", async () => {
    const { req, findByID } = request({ rows: [] })

    await expect(lockDocument(req, Slugs.Collections.COURSES, 9)).rejects.toThrow(
      "This courses record was not found.",
    )
    expect(findByID).not.toHaveBeenCalled()
  })

  it("refuses to lock outside a transaction", async () => {
    const { req } = request({ transactionID: null })

    await expect(lockDocument(req, Slugs.Collections.COURSES, 1)).rejects.toThrow(
      "requires a database transaction",
    )
  })

  it("refuses to lock a table the adapter does not map", async () => {
    const { req } = request({ tables: [] })

    await expect(lockDocument(req, Slugs.Collections.COURSES, 1)).rejects.toThrow(
      "No table is mapped for courses.",
    )
  })
})
