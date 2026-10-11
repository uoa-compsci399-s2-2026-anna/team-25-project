import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { getInstitutionOptionsCached } from "@/features/institutions/institutions.queries"
import { getResourceCourseOptionsCached } from "../resources.queries"
import { ResourcesFilterServer, ResourcesFilterServerSkeleton } from "./ResourcesFilterServer"

type Option = { label: string; value: number }

vi.mock("@/features/institutions/institutions.queries", () => ({
  getInstitutionOptionsCached: vi.fn(),
}))
vi.mock("../resources.queries", () => ({ getResourceCourseOptionsCached: vi.fn() }))
vi.mock("./ResourcesActiveFilters", () => ({
  ResourcesActiveFilters: () => <p>Active filters</p>,
}))
vi.mock("./ResourcesFilterBar", () => ({
  ResourcesFilterBar: ({
    courses,
    institutions,
  }: {
    courses: Option[]
    institutions: Option[]
  }) => (
    <div>
      <p>Courses {courses.map(({ label }) => label).join(", ")}</p>
      <p>Universities {institutions.map(({ label }) => label).join(", ")}</p>
    </div>
  ),
}))

describe("ResourcesFilterServer", () => {
  it("gives the course and university options to the filter bar, with the chips below", async () => {
    vi.mocked(getResourceCourseOptionsCached).mockResolvedValue([{ label: "SE 101", value: 4 }])
    vi.mocked(getInstitutionOptionsCached).mockResolvedValue([
      { label: "University of Auckland", value: 12 },
    ])

    render(await ResourcesFilterServer())

    expect(screen.getByText("Courses SE 101")).toBeInTheDocument()
    expect(screen.getByText("Universities University of Auckland")).toBeInTheDocument()
    expect(screen.getByText("Active filters")).toBeInTheDocument()
  })
})

describe("ResourcesFilterServerSkeleton", () => {
  it("renders a placeholder for the bar's two filters and no status tabs", () => {
    const { container } = render(<ResourcesFilterServerSkeleton />)

    expect(
      container.querySelector('[data-slot="filter-bar-skeleton-status"]'),
    ).not.toBeInTheDocument()
    expect(container.querySelectorAll('[data-slot="filter-bar-skeleton-filter"]')).toHaveLength(2)
  })
})
