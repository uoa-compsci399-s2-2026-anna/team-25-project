import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { getPublicationTagsCached, getPublicationYearsCached } from "../publications.queries"
import {
  PublicationsFilterServer,
  PublicationsFilterServerSkeleton,
} from "./PublicationsFilterServer"

vi.mock("../publications.queries", () => ({
  getPublicationTagsCached: vi.fn(),
  getPublicationYearsCached: vi.fn(),
}))
vi.mock("./PublicationsActiveFilters", () => ({
  PublicationsActiveFilters: () => <p>Active filters</p>,
}))
vi.mock("./PublicationsFilterBar", () => ({
  PublicationsFilterBar: ({ tags, years }: { tags: string[]; years: number[] }) => (
    <div>
      <p>Tags {tags.join(", ")}</p>
      <p>Years {years.join(", ")}</p>
    </div>
  ),
}))

describe("PublicationsFilterServer", () => {
  it("gives the publication tags and years to the filter bar, with the chips below", async () => {
    vi.mocked(getPublicationTagsCached).mockResolvedValue(["Assessment", "Teamwork"])
    vi.mocked(getPublicationYearsCached).mockResolvedValue([2025, 2021])

    render(await PublicationsFilterServer())

    expect(screen.getByText("Tags Assessment, Teamwork")).toBeInTheDocument()
    expect(screen.getByText("Years 2025, 2021")).toBeInTheDocument()
    expect(screen.getByText("Active filters")).toBeInTheDocument()
  })
})

describe("PublicationsFilterServerSkeleton", () => {
  it("renders a placeholder for the bar's three filters and no status tabs", () => {
    const { container } = render(<PublicationsFilterServerSkeleton />)

    expect(
      container.querySelector('[data-slot="filter-bar-skeleton-status"]'),
    ).not.toBeInTheDocument()
    expect(container.querySelectorAll('[data-slot="filter-bar-skeleton-filter"]')).toHaveLength(3)
  })
})
