import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ProposalsFilterServer } from "@/features/proposals/components/ProposalsFilterServer"
import { ProposalsList } from "@/features/proposals/components/ProposalsList"
import Page from "./page"

vi.mock("@/features/proposals/components/ProposalsFilterServer", () => ({
  ProposalsFilterServer: vi.fn(() => <div>Proposal filters</div>),
}))
vi.mock("@/features/proposals/components/ProposalsList", () => ({
  ProposalsList: vi.fn(() => <div>Proposal results</div>),
}))

describe("proposals page", () => {
  it("gives the search params to the filter and result sections", () => {
    const searchParams = Promise.resolve({ q: "peer" })

    render(<Page searchParams={searchParams} />)

    expect(screen.getByText("Proposal filters")).toBeInTheDocument()
    expect(screen.getByText("Proposal results")).toBeInTheDocument()
    expect(ProposalsFilterServer).toHaveBeenCalledWith(
      expect.objectContaining({ searchParams }),
      undefined,
    )
    expect(ProposalsList).toHaveBeenCalledWith(expect.objectContaining({ searchParams }), undefined)
  })
})
