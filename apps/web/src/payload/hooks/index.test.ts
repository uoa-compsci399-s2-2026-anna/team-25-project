import type { Course } from "@repo/shared/payload-types"
import { APIError, type CollectionConfig, type PayloadRequest } from "payload"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { lockDocument } from "@/lib/payload/lock"
import { Slugs } from "@/lib/payload/slugs"
import { internal, VERSION_WRITE, type VersionWrite } from "./helpers"
import { guardCourseWrite } from "./index"

vi.mock("@/lib/payload/lock", () => ({ lockDocument: vi.fn() }))

const versions = { slug: Slugs.Collections.COURSE_VERSIONS } as CollectionConfig
const courses = { slug: Slugs.Collections.COURSES } as CollectionConfig

const course = { id: 5, owner: 42, editors: [7] } as unknown as Course

// The mock stands in for the row lock alone; the argument checks it inherits from
// the real one are what the capture tests below rely on.
beforeEach(() => {
  vi.mocked(lockDocument).mockReset()
  vi.mocked(lockDocument).mockImplementation(async (_req, collection, id) => {
    if (!id) throw new APIError(`A ${collection} record is required.`, 400)
    return course as never
  })
})

// The request is recorded before the course lock, so a create carrying no `course`
// fails at the lock with the capture already observable and no database in play.
const run = (args: Record<string, unknown>, req: PayloadRequest) =>
  guardCourseWrite({
    args,
    collection: versions,
    context: req.context,
    operation: "create",
    req,
  } as unknown as Parameters<typeof guardCourseWrite>[0])

const record = async (args: Record<string, unknown>) => {
  const req = { context: {} } as unknown as PayloadRequest
  await expect(run(args, req)).rejects.toThrow("A courses record is required")

  return req.context[VERSION_WRITE] as VersionWrite
}

describe("guardCourseWrite request capture", () => {
  it("records no metadata for a request that sends none", async () => {
    expect((await record({ data: { period: "S1" } })).sentMetadataKeys).toEqual(new Set())
  })

  it("records a key sent as an explicit null", async () => {
    const { sentMetadataKeys } = await record({ data: { publishedAt: null } })
    expect(sentMetadataKeys).toEqual(new Set(["publishedAt"]))
  })

  // Payload reads `draft` for truthiness, so these follow it rather than the query
  // string. REST narrows `?draft=` to a boolean before the operation runs, so the
  // string cases only arise through the Local API, where Payload agrees with this.
  it.each([
    [{ draft: true }, true],
    [{ draft: "true" }, true],
    [{ draft: 1 }, true],
    [{ draft: false }, false],
    [{ draft: undefined }, false],
    [{}, false],
  ])("reads the draft flag from %o", async (args, expected) => {
    expect((await record({ ...args, data: {} })).draft).toBe(expected)
  })
})

describe("guardCourseWrite duplicate", () => {
  it("refuses a duplicate before it can copy an offering's period", async () => {
    const req = { context: {} } as unknown as PayloadRequest
    await expect(run({ data: {}, duplicateFromID: 7 }, req)).rejects.toThrow(
      "Duplicating an offering is not supported",
    )
  })
})

const member = (id: number) => ({ id, collection: Slugs.Collections.MEMBERS })

const guard = (
  args: Record<string, unknown>,
  operation: string,
  { user = member(42) as unknown, collection = versions, doc = undefined as unknown } = {},
) => {
  const req = {
    user,
    context: {},
    payload: { findByID: vi.fn().mockResolvedValue(doc) },
  } as unknown as PayloadRequest

  const result = guardCourseWrite({
    args,
    collection,
    context: req.context,
    operation,
    req,
  } as unknown as Parameters<typeof guardCourseWrite>[0])

  return { req, result }
}

describe("guardCourseWrite refusals", () => {
  // Restoring writes a revision back without the publication checks.
  it("refuses a restore", async () => {
    await expect(guard({ id: 1 }, "restoreVersion").result).rejects.toThrow(
      "Restoring a revision is not supported.",
    )
  })

  // Payload's bulk operations catch per-document errors and can commit partial work.
  it.each(["update", "delete"])("refuses a bulk %s", async (operation) => {
    await expect(guard({ where: { id: { equals: 1 } } }, operation).result).rejects.toThrow(
      "Bulk writes are not supported.",
    )
  })

  it("refuses an update whose ID is empty", async () => {
    await expect(guard({ id: 0 }, "update").result).rejects.toThrow(
      "Bulk writes are not supported.",
    )
  })

  it("refuses a caller who cannot edit the course", async () => {
    await expect(
      guard({ data: { course: 5 } }, "create", { user: member(9) }).result,
    ).rejects.toThrow("You cannot edit this course.")
  })
})

describe("guardCourseWrite pass-through", () => {
  // A nested server write was authorised by the operation that started it.
  it("lets an internal write past every check", async () => {
    const args = { id: 1 }
    const { req, result } = internal.run(true, () => guard(args, "restoreVersion"))

    await expect(result).resolves.toBe(args)
    expect(req.context[VERSION_WRITE]).toBeUndefined()
    expect(lockDocument).not.toHaveBeenCalled()
  })

  it("leaves a single-document delete to the collection's own delete hook", async () => {
    const args = { id: 1 }
    await expect(guard(args, "delete").result).resolves.toBe(args)
    expect(lockDocument).not.toHaveBeenCalled()
  })

  it("records nothing for a course write, which has no version metadata", async () => {
    const { req } = guard({ data: { code: "SE 101" } }, "create", { collection: courses })
    expect(req.context[VERSION_WRITE]).toBeUndefined()
  })

  it("does not authorise a create that carries no data", async () => {
    const args = { draft: true }
    await expect(guard(args, "create").result).resolves.toBe(args)
    expect(lockDocument).not.toHaveBeenCalled()
  })
})

describe("guardCourseWrite authorisation", () => {
  it("locks the course a new offering names", async () => {
    const args = { data: { course: { id: 5 } } }

    await expect(guard(args, "create").result).resolves.toBe(args)
    expect(lockDocument).toHaveBeenCalledWith(expect.anything(), Slugs.Collections.COURSES, 5)
  })

  // An offering's permission resolves through its course, so the stored document
  // is read first and the course it belongs to is what gets locked.
  it("locks the course an existing offering belongs to", async () => {
    const { req, result } = guard({ id: 3, data: {} }, "update", { doc: { id: 3, course: 5 } })

    await expect(result).resolves.toEqual({ id: 3, data: {} })
    expect(req.payload.findByID).toHaveBeenCalledWith({
      collection: Slugs.Collections.COURSE_VERSIONS,
      id: 3,
      depth: 0,
      req,
      overrideAccess: true,
    })
    expect(lockDocument).toHaveBeenCalledWith(req, Slugs.Collections.COURSES, 5)
  })

  it("locks the course itself on a course update", async () => {
    const { req } = guard({ id: 5, data: {} }, "update", { collection: courses, doc: { id: 5 } })

    await new Promise(setImmediate)
    expect(req.payload.findByID).toHaveBeenCalledWith(
      expect.objectContaining({ collection: Slugs.Collections.COURSES, id: 5 }),
    )
    expect(lockDocument).toHaveBeenCalledWith(req, Slugs.Collections.COURSES, 5)
  })

  it("refuses an update whose ID is not a relationship", async () => {
    await expect(guard({ id: "abc" }, "update").result).rejects.toThrow(
      "A valid relationship is required.",
    )
  })
})
