import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { PublicationsList } from "@/features/publications/components/PublicationsList"
import Page from "./page"

vi.mock("@/features/publications/components/AddPublicationTrigger", () => ({
  AddPublicationTrigger: () => null,
}))
vi.mock("@/features/publications/components/PublicationsFilterServer", () => ({
  PublicationsFilterServer: () => <div>Publication filters</div>,
  PublicationsFilterServerSkeleton: () => null,
}))
vi.mock("@/features/publications/components/PublicationsList", () => ({
  PublicationsList: vi.fn(() => <div>Publication results</div>),
  PublicationsListSkeleton: () => null,
}))

describe("publications page", () => {
  it("shows the filters and gives the search params to the results", () => {
    const searchParams = Promise.resolve({ q: "capstone" })

    render(<Page searchParams={searchParams} />)

    expect(screen.getByRole("heading", { name: "Publications" })).toBeInTheDocument()
    expect(screen.getByText("Publication filters")).toBeInTheDocument()
    expect(screen.getByText("Publication results")).toBeInTheDocument()
    expect(PublicationsList).toHaveBeenCalledWith(
      expect.objectContaining({ searchParams }),
      undefined,
    )
  })
})
