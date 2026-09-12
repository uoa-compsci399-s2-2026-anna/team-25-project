import { ProposalStatus } from "@repo/shared/enums/proposals"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { getInstitutionOptionsCached } from "@/features/institutions/institutions.queries"
import { loadProposalStatusCounts } from "../proposals.queries"
import { ProposalsFilterServer } from "./ProposalsFilterServer"

vi.mock("@/features/institutions/institutions.queries", () => ({
  getInstitutionOptionsCached: vi.fn(),
}))
vi.mock("../proposals.queries", () => ({ loadProposalStatusCounts: vi.fn() }))
vi.mock("./ProposalsFilterBar", () => ({
  ProposalsFilterBar: ({ counts, institutions }: { counts: object; institutions: object[] }) => (
    <div>
      {JSON.stringify(counts)} {JSON.stringify(institutions)}
    </div>
  ),
}))

describe("ProposalsFilterServer", () => {
  it("loads counts and institutions for the parsed filters", async () => {
    const counts = { [ProposalStatus.ACTIVE]: 2, [ProposalStatus.CLOSED]: 1 }
    const institutions = [{ label: "University of Auckland", value: 12 }]
    vi.mocked(loadProposalStatusCounts).mockResolvedValue(counts)
    vi.mocked(getInstitutionOptionsCached).mockResolvedValue(institutions)

    render(
      await ProposalsFilterServer({
        searchParams: Promise.resolve({ q: "peer", status: "closed" }),
      }),
    )

    expect(loadProposalStatusCounts).toHaveBeenCalledWith({
      institutionId: undefined,
      search: "peer",
      tag: undefined,
    })
    expect(getInstitutionOptionsCached).toHaveBeenCalledOnce()
    expect(screen.getByText(/University of Auckland/)).toBeInTheDocument()
  })
})
