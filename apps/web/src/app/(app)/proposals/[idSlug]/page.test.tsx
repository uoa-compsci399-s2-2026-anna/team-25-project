import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ProposalPage } from "@/features/proposals/components/ProposalPage/ProposalPage"
import Page from "./page"

vi.mock("@/features/proposals/components/ProposalPage/ProposalPage", () => ({
  ProposalPage: vi.fn(() => <div>Proposal content</div>),
}))

vi.mock("@/features/auth/components/MemberOnly/MemberOnly", () => ({
  MemberOnly: ({ children }: { children: React.ReactNode }) => children,
}))

describe("proposal detail page", () => {
  it("gives the route params to ProposalPage", () => {
    const params = Promise.resolve({ idSlug: "1-peer-review" })

    render(<Page params={params} />)

    expect(screen.getByText("Proposal content")).toBeInTheDocument()
    expect(ProposalPage).toHaveBeenCalledWith(expect.objectContaining({ params }), undefined)
  })
})
