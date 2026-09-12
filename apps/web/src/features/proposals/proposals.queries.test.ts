import { ProposalStatus, ProposalTag } from "@repo/shared/enums/proposals"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import {
  getProposalStatusCounts,
  getProposals,
  loadProposalStatusCounts,
  loadProposalsPage,
} from "./proposals.queries"

vi.mock("@/lib/payload/getPayloadClient", () => ({ getPayloadClient: vi.fn() }))

const find = vi.fn()
const count = vi.fn()

describe("getProposals", () => {
  beforeEach(() => {
    find.mockReset()
    vi.mocked(getPayloadClient).mockResolvedValue({
      find,
    } as unknown as Awaited<ReturnType<typeof getPayloadClient>>)
  })

  it("applies all proposal list filters", async () => {
    await getProposals(
      {
        institutionId: 12,
        search: "  peer assessment  ",
        sort: "oldest",
        status: ProposalStatus.ACTIVE,
        tag: ProposalTag.ASSESSMENT,
      },
      { limit: 10, page: 2 },
    )

    expect(find).toHaveBeenCalledWith({
      collection: "proposals",
      limit: 10,
      page: 2,
      sort: "createdAt",
      where: {
        "author.institution": { equals: 12 },
        or: [
          { title: { contains: "peer assessment" } },
          { summary: { contains: "peer assessment" } },
        ],
        status: { equals: ProposalStatus.ACTIVE },
        tags: { in: [ProposalTag.ASSESSMENT] },
      },
    })
  })

  it("returns all proposals newest first when filters are empty", async () => {
    await getProposals({}, { limit: 20, page: 1 })

    expect(find).toHaveBeenCalledWith({
      collection: "proposals",
      limit: 20,
      page: 1,
      sort: "-createdAt",
      where: {},
    })
  })
})

describe("getProposalStatusCounts", () => {
  beforeEach(() => {
    count.mockReset()
    vi.mocked(getPayloadClient).mockResolvedValue({
      count,
    } as unknown as Awaited<ReturnType<typeof getPayloadClient>>)
  })

  it("counts each status under the other filters", async () => {
    const totals: Record<ProposalStatus, number> = {
      [ProposalStatus.ACTIVE]: 27,
      [ProposalStatus.CLOSED]: 14,
    }
    count.mockImplementation(({ where }) =>
      Promise.resolve({ totalDocs: totals[where.status.equals as ProposalStatus] }),
    )

    const counts = await getProposalStatusCounts({
      institutionId: 12,
      search: "peer",
      tag: ProposalTag.ASSESSMENT,
    })

    expect(counts).toEqual(totals)
    expect(count).toHaveBeenCalledTimes(Object.values(ProposalStatus).length)
    for (const status of Object.values(ProposalStatus)) {
      expect(count).toHaveBeenCalledWith({
        collection: "proposals",
        where: {
          "author.institution": { equals: 12 },
          or: [{ title: { contains: "peer" } }, { summary: { contains: "peer" } }],
          status: { equals: status },
          tags: { in: [ProposalTag.ASSESSMENT] },
        },
      })
    }
  })
})

describe("search result loading", () => {
  beforeEach(() => {
    find.mockReset()
    count.mockReset()
    find.mockResolvedValue({ docs: [], totalDocs: 0 })
    count.mockResolvedValue({ totalDocs: 0 })
    vi.mocked(getPayloadClient).mockResolvedValue({
      count,
      find,
    } as unknown as Awaited<ReturnType<typeof getPayloadClient>>)
  })

  it("loads a searched proposal page directly", async () => {
    await loadProposalsPage({ search: "  peer  " }, { limit: 10, page: 3 })

    expect(find).toHaveBeenCalledWith({
      collection: "proposals",
      limit: 10,
      page: 3,
      sort: "-createdAt",
      where: {
        or: [{ title: { contains: "peer" } }, { summary: { contains: "peer" } }],
      },
    })
  })

  it("loads searched status counts directly", async () => {
    await loadProposalStatusCounts({ search: "peer" })

    expect(count).toHaveBeenCalledTimes(Object.values(ProposalStatus).length)
  })
})
