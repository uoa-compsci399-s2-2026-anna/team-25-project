import type { PayloadRequest } from "payload"
import { describe, expect, it, vi } from "vitest"
import { Slugs } from "@/lib/payload/slugs"
import { versionDelete, versionHistoryRead, versionRead, versionUpdate } from "./CourseVersions"

const adminUser = { id: 1, collection: Slugs.Collections.ADMIN }
const memberUser = { id: 42, collection: Slugs.Collections.MEMBERS }

// `staffOf` is the offerings whose collection-table teaching team lists the member.
const request = (user: unknown, staffOf: number[] = []) => {
  const find = vi.fn(async () => ({ docs: staffOf.map((id) => ({ id })) }))
  return { req: { user, payload: { find } } as unknown as PayloadRequest, find }
}

const editable = (prefix: string) => ({
  or: [{ [`${prefix}owner`]: { equals: 42 } }, { [`${prefix}editors`]: { contains: 42 } }],
})

const published = { _status: { equals: "published" } }

describe("versionRead", () => {
  it("gives an admin unconstrained reads", async () => {
    expect(await versionRead(request(adminUser))).toBe(true)
  })

  it("denies an anonymous request", async () => {
    expect(await versionRead(request(null))).toBe(false)
  })

  it("adds a member's own offerings to what is published", async () => {
    expect(await versionRead(request(memberUser))).toEqual({
      or: [published, editable("course.")],
    })
  })

  it("adds the offerings a member teaches", async () => {
    expect(await versionRead(request(memberUser, [3, 4]))).toEqual({
      or: [published, editable("course."), { id: { in: [3, 4] } }],
    })
  })

  it("looks the teaching team up in the collection table, not in drafts", async () => {
    const { req, find } = request(memberUser)
    await versionRead({ req })

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: Slugs.Collections.COURSE_VERSIONS,
        where: { "teachingTeam.member": { equals: 42 } },
        overrideAccess: true,
      }),
    )
    expect(find.mock.calls[0]).not.toHaveProperty("0.draft")
  })
})

describe("versionHistoryRead", () => {
  it("gives an admin the whole history", async () => {
    expect(await versionHistoryRead(request(adminUser))).toBe(true)
  })

  // History holds unpublished drafts, so it never opens to the public.
  it("denies an anonymous request", async () => {
    expect(await versionHistoryRead(request(null))).toBe(false)
  })

  it("limits a member to the courses they own or edit", async () => {
    expect(await versionHistoryRead(request(memberUser))).toEqual(editable("version.course."))
  })

  // Scoped by the current team, so an old revision that listed a removed member
  // does not reopen the history to them.
  it("adds the history of the offerings a member teaches now", async () => {
    expect(await versionHistoryRead(request(memberUser, [3]))).toEqual({
      or: [editable("version.course."), { parent: { in: [3] } }],
    })
  })
})

describe("versionUpdate", () => {
  it("gives an admin unconstrained writes", async () => {
    expect(await versionUpdate(request(adminUser))).toBe(true)
  })

  it("limits a member to their own courses' offerings", async () => {
    expect(await versionUpdate(request(memberUser))).toEqual(editable("course."))
  })

  it("adds the offerings a member teaches", async () => {
    expect(await versionUpdate(request(memberUser, [3]))).toEqual({
      or: [editable("course."), { id: { in: [3] } }],
    })
  })

  it("denies an anonymous request", async () => {
    expect(await versionUpdate(request(null))).toBe(false)
  })
})

describe("versionDelete", () => {
  it("leaves teaching staff out", () => {
    expect(versionDelete(request(memberUser, [3]))).toEqual(editable("course."))
  })

  it("denies an anonymous request", () => {
    expect(versionDelete(request(null))).toBe(false)
  })
})
