import { ProposalStatus } from "@repo/shared/enums/proposals"
import { revalidateTag } from "next/cache"
import type { FieldHook, PayloadRequest } from "payload"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { Slugs } from "@/lib/payload/slugs"
import {
  defaultProposalAuthor,
  generateProposalSlug,
  revalidateDeletedProposal,
  revalidateProposals,
  setProposalClosedAt,
} from "./Proposals"

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }))

const args: Parameters<FieldHook>[0] = {
  blockData: undefined,
  collection: null,
  context: {},
  field: { name: "proposalSlug", type: "text" },
  global: null,
  indexPath: [],
  operation: "create",
  path: [],
  req: { user: null } as PayloadRequest,
  schemaPath: [],
  siblingData: {},
  siblingFields: [],
}

describe("proposal cache revalidation", () => {
  beforeEach(() => {
    vi.mocked(revalidateTag).mockReset()
  })

  it.each([revalidateProposals, revalidateDeletedProposal])(
    "marks proposal queries stale after a write",
    async (hook) => {
      const doc = { id: 1 }
      const result = await hook({
        doc,
        req: { context: {} },
      } as never)

      expect(revalidateTag).toHaveBeenCalledWith("proposals", "max")
      expect(result).toBe(doc)
    },
  )

  it.each([revalidateProposals, revalidateDeletedProposal])(
    "can skip revalidation through request context",
    async (hook) => {
      await hook({
        doc: { id: 1 },
        req: { context: { disableRevalidate: true } },
      } as never)

      expect(revalidateTag).not.toHaveBeenCalled()
    },
  )
})

describe("generateProposalSlug", () => {
  it.each([
    ["Team Assessment 2026", "team-assessment-2026"],
    ["  Research: teams & assessment!  ", "research-teams-assessment"],
    ["M\u0101ori caf\u00e9 research", "maori-cafe-research"],
    ["Ma\u0304ori", "maori"],
    ["a".repeat(81), "a".repeat(80)],
    [`${"a".repeat(79)} b`, "a".repeat(79)],
  ])("normalizes %j", async (title, expected) => {
    expect(await generateProposalSlug({ ...args, data: { title } })).toBe(expected)
  })

  it("regenerates a stale slug from an updated title", async () => {
    expect(
      await generateProposalSlug({
        ...args,
        operation: "update",
        data: { title: "New title" },
        originalDoc: { id: 1, title: "Old title" },
        value: "old-title",
      }),
    ).toBe("new-title")
  })

  it.each([undefined, {}, { summary: "Updated summary" }])(
    "uses the saved title when a partial update omits it: %j",
    async (data) => {
      expect(
        await generateProposalSlug({
          ...args,
          operation: "update",
          data,
          originalDoc: { id: 1, title: "Saved title" },
          value: "stale-slug",
        }),
      ).toBe("saved-title")
    },
  )

  it.each([undefined, "", "!!!", "\u7814\u7a76"])(
    "preserves the existing slug when the title has no usable characters: %j",
    async (title) => {
      expect(await generateProposalSlug({ ...args, data: { title }, value: "existing-slug" })).toBe(
        "existing-slug",
      )
    },
  )

  it.each([undefined, "", "!!!"])("uses the default slug for title %j", async (title) => {
    expect(await generateProposalSlug({ ...args, data: { title } })).toBe("proposal")
  })
})

describe("setProposalClosedAt", () => {
  const now = "2026-09-05T12:00:00.000Z"
  const closedAt = "2026-08-01T12:00:00.000Z"

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(now))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("stamps the date when an active proposal closes", async () => {
    expect(
      await setProposalClosedAt({
        ...args,
        siblingData: { status: ProposalStatus.CLOSED },
        originalDoc: { id: 1, status: ProposalStatus.ACTIVE },
        value: null,
      }),
    ).toBe(now)
  })

  it("keeps an existing close date rather than stamping it again", async () => {
    expect(
      await setProposalClosedAt({
        ...args,
        siblingData: { status: ProposalStatus.CLOSED },
        value: closedAt,
      }),
    ).toBe(closedAt)
  })

  it("preserves the close date on a partial update without a status", async () => {
    expect(
      await setProposalClosedAt({
        ...args,
        operation: "update",
        originalDoc: { id: 1, status: ProposalStatus.CLOSED },
        value: closedAt,
      }),
    ).toBe(closedAt)
  })

  it("clears the close date when a proposal reopens", async () => {
    expect(
      await setProposalClosedAt({
        ...args,
        siblingData: { status: ProposalStatus.ACTIVE },
        originalDoc: { id: 1, status: ProposalStatus.CLOSED },
        value: closedAt,
      }),
    ).toBeNull()
  })

  it("leaves a proposal without a status unclosed", async () => {
    expect(await setProposalClosedAt(args)).toBeNull()
  })
})

describe("defaultProposalAuthor", () => {
  const req = { user: { id: 42, collection: Slugs.Collections.MEMBERS } } as PayloadRequest

  it.each([undefined, null, [], 99])(
    "adds the creator without collaborators: %j",
    async (value) => {
      expect(await defaultProposalAuthor({ ...args, req, value })).toEqual([42])
    },
  )

  it("puts the creator first, keeps collaborators and removes duplicate IDs", async () => {
    const value = [7, 42, 7, 8, 42]
    expect(await defaultProposalAuthor({ ...args, req, value })).toEqual([42, 7, 8])
    expect(value).toEqual([7, 42, 7, 8, 42])
  })

  it.each(["update", "read", "delete"] as const)(
    "does not change authors during %s",
    async (operation) => {
      const value = [7, 8]
      expect(await defaultProposalAuthor({ ...args, req, operation, value })).toBe(value)
    },
  )

  it("lets admins set authors without adding the admin ID", async () => {
    const value = [7, 8]
    const adminReq = { user: { id: 1, collection: Slugs.Collections.ADMIN } } as PayloadRequest
    expect(await defaultProposalAuthor({ ...args, req: adminReq, value })).toBe(value)
  })

  it("does not choose an author for an anonymous request", async () => {
    expect(await defaultProposalAuthor(args)).toBeUndefined()
  })
})
