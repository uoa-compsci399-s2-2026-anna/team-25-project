import type { Publication } from "@repo/shared/payload-types"
import { revalidateTag } from "next/cache"
import { type PayloadRequest, ValidationError } from "payload"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { Slugs } from "@/lib/payload/slugs"
import {
  blankToNull,
  requireLinkedAuthor,
  revalidateDeletedPublication,
  revalidatePublications,
} from "./Publications"

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }))

type Authors = Publication["authors"]

const memberReq = { user: { id: 42, collection: Slugs.Collections.MEMBERS } } as PayloadRequest
const adminReq = { user: { id: 1, collection: Slugs.Collections.ADMIN } } as PayloadRequest

const run = async (req: PayloadRequest, authors?: Authors, originalAuthors?: Authors) =>
  requireLinkedAuthor({
    data: authors === undefined ? {} : { authors },
    originalDoc: originalAuthors && ({ authors: originalAuthors } as Publication),
    req,
  } as Parameters<typeof requireLinkedAuthor>[0])

describe("blankToNull", () => {
  const run = (value: unknown) => blankToNull({ value } as Parameters<typeof blankToNull>[0])

  it.each(["", "   "])("stores a blank value (%j) as null", (value) => {
    expect(run(value)).toBeNull()
  })

  // Partial updates leave the field undefined, which must not clear the stored value.
  it.each([undefined, null, "10.1145/3313831.3376518"])("keeps %j", (value) => {
    expect(run(value)).toBe(value)
  })
})

describe("requireLinkedAuthor", () => {
  it("lets admins save without being linked", async () => {
    await expect(run(adminReq, [{ name: "A" }])).resolves.toEqual({ authors: [{ name: "A" }] })
  })

  it("lets a member save when they are linked", async () => {
    const authors = [{ name: "A" }, { name: "Me", member: 42 }]
    await expect(run(memberReq, authors)).resolves.toEqual({ authors })
  })

  it("accepts a populated member relation", async () => {
    const authors = [{ name: "Me", member: { id: 42 } }] as Authors
    await expect(run(memberReq, authors)).resolves.toEqual({ authors })
  })

  it("falls back to the stored authors when the update omits them", async () => {
    await expect(run(memberReq, undefined, [{ name: "Me", member: 42 }])).resolves.toEqual({})
  })

  it.each([
    ["a create without them", [{ name: "A", member: 7 }], undefined],
    ["an update that removes them", [{ name: "A" }], [{ name: "Me", member: 42 }]],
    ["a save with no authors at all", undefined, undefined],
  ])("rejects %s", async (_, authors, originalAuthors) => {
    const result = run(memberReq, authors, originalAuthors)
    await expect(result).rejects.toBeInstanceOf(ValidationError)
    await expect(result).rejects.toMatchObject({
      status: 400,
      data: { errors: [{ path: "authors" }] },
    })
  })
})

describe("publication cache revalidation", () => {
  beforeEach(() => {
    vi.mocked(revalidateTag).mockReset()
  })

  const doc = { id: 1, authors: [{ name: "A", member: 42 }, { name: "B" }] }

  it.each([revalidatePublications, revalidateDeletedPublication])(
    "marks publication queries and linked author profiles stale after a write",
    async (hook) => {
      const result = await hook({ doc, req: { context: {} } } as never)

      expect(revalidateTag).toHaveBeenCalledWith("publications", "max")
      expect(revalidateTag).toHaveBeenCalledWith("publications:1", "max")
      expect(revalidateTag).toHaveBeenCalledWith("member:42", "max")
      expect(revalidateTag).toHaveBeenCalledTimes(3)
      expect(result).toBe(doc)
    },
  )

  it("marks an unlinked author's profile stale, once per member", async () => {
    await revalidatePublications({
      doc,
      previousDoc: {
        id: 1,
        authors: [
          { name: "A", member: { id: 42 } },
          { name: "C", member: 7 },
        ],
      },
      req: { context: {} },
    } as never)

    expect(revalidateTag).toHaveBeenCalledWith("member:7", "max")
    expect(vi.mocked(revalidateTag).mock.calls.filter(([tag]) => tag === "member:42")).toHaveLength(
      1,
    )
  })

  it.each([revalidatePublications, revalidateDeletedPublication])(
    "can skip revalidation through request context",
    async (hook) => {
      await hook({ doc, req: { context: { disableRevalidate: true } } } as never)

      expect(revalidateTag).not.toHaveBeenCalled()
    },
  )
})
