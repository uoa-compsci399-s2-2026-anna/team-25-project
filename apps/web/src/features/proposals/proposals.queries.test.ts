import { ProposalStatus, ProposalTag } from "@repo/shared/enums/proposals"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { getProposals } from "./proposals.queries"

vi.mock("@/lib/payload/getPayloadClient", () => ({ getPayloadClient: vi.fn() }))

const find = vi.fn()

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
