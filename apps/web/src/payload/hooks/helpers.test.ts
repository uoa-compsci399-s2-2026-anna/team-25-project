import type { Course } from "@repo/shared/payload-types"
import type { PayloadRequest } from "payload"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { lockDocument } from "@/lib/payload/lock"
import { Slugs } from "@/lib/payload/slugs"
import {
  fail,
  internal,
  isInternal,
  lockCourse,
  requireEditor,
  requireID,
  versionMetadataKeys,
} from "./helpers"

vi.mock("@/lib/payload/lock", () => ({ lockDocument: vi.fn() }))

const request = (user: unknown) => ({ user }) as PayloadRequest

const course = { id: 1, owner: 42, editors: [] } as unknown as Course

beforeEach(() => vi.mocked(lockDocument).mockReset())

describe("fail", () => {
  it("defaults to a 400", () => {
    expect(() => fail("Bad request")).toThrowError(
      expect.objectContaining({ message: "Bad request", status: 400 }),
    )
  })

  it("carries the status it is given", () => {
    expect(() => fail("Denied", 403)).toThrowError(expect.objectContaining({ status: 403 }))
  })
})

describe("requireID", () => {
  it.each([
    [7, 7],
    ["7", 7],
    [{ id: 7 }, 7],
  ])("resolves %j to %j", (value, expected) => {
    expect(requireID(value)).toBe(expected)
  })

  it.each([undefined, null, "abc", {}])("refuses %j", (value) => {
    expect(() => requireID(value)).toThrow("A valid relationship is required.")
  })
})

describe("lockCourse", () => {
  it("locks the course row for the request", async () => {
    vi.mocked(lockDocument).mockResolvedValue(course)
    const req = request(null)

    await expect(lockCourse(req, 1)).resolves.toBe(course)
    expect(lockDocument).toHaveBeenCalledWith(req, Slugs.Collections.COURSES, 1)
  })
})

describe("requireEditor", () => {
  it("lets an editor through", () => {
    const req = request({ id: 42, collection: Slugs.Collections.MEMBERS })
    expect(() => requireEditor(req, course)).not.toThrow()
  })

  it("refuses anyone else with a 403", () => {
    const req = request({ id: 9, collection: Slugs.Collections.MEMBERS })
    expect(() => requireEditor(req, course)).toThrowError(
      expect.objectContaining({ message: "You cannot edit this course.", status: 403 }),
    )
  })
})

describe("the internal guard", () => {
  it("is off outside a nested operation", () => {
    expect(isInternal()).toBe(false)
  })

  it("is on inside one", () => {
    expect(internal.run(true, isInternal)).toBe(true)
  })

  // The store is scoped to the nested operation, so concurrent work on the same
  // request cannot inherit permission to write server-managed fields.
  it("does not leak into work started outside it", async () => {
    let outside: boolean | undefined
    const observe = new Promise<void>((resolve) => {
      setImmediate(() => {
        outside = isInternal()
        resolve()
      })
    })

    internal.run(true, () => expect(isInternal()).toBe(true))
    await observe
    expect(outside).toBe(false)
  })
})

describe("versionMetadataKeys", () => {
  // Every one of these is written by publication alone, so the list is the guard.
  it("names the server-managed fields", () => {
    expect([...versionMetadataKeys]).toEqual(["publishedAt", "publishedBy", "displaySnapshot"])
  })
})
