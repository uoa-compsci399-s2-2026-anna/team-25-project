import type { Publication } from "@repo/shared/payload-types"
import { type PayloadRequest, ValidationError } from "payload"
import { describe, expect, it } from "vitest"
import { Slugs } from "@/lib/payload/slugs"
import { requireLinkedAuthor } from "./Publications"

type Authors = Publication["authors"]

const memberReq = { user: { id: 42, collection: Slugs.Collections.MEMBERS } } as PayloadRequest
const adminReq = { user: { id: 1, collection: Slugs.Collections.ADMIN } } as PayloadRequest

const run = async (req: PayloadRequest, authors?: Authors, originalAuthors?: Authors) =>
  requireLinkedAuthor({
    data: authors === undefined ? {} : { authors },
    originalDoc: originalAuthors && ({ authors: originalAuthors } as Publication),
    req,
  } as Parameters<typeof requireLinkedAuthor>[0])

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
  ])("rejects %s", async (_, authors, originalAuthors) => {
    const result = run(memberReq, authors, originalAuthors)
    await expect(result).rejects.toBeInstanceOf(ValidationError)
    await expect(result).rejects.toMatchObject({
      status: 400,
      data: { errors: [{ path: "authors" }] },
    })
  })
})
