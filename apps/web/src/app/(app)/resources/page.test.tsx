import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ResourcesList } from "@/features/resources/components/ResourcesList"
import Page from "./page"

vi.mock("@/features/resources/components/ResourcesFilterServer", () => ({
  ResourcesFilterServer: () => <div>Resource filters</div>,
  ResourcesFilterServerSkeleton: () => null,
}))
vi.mock("@/features/resources/components/ResourcesList", () => ({
  ResourcesList: vi.fn(() => <div>Resource results</div>),
  ResourcesListSkeleton: () => null,
}))

describe("resources page", () => {
  it("shows the filters and gives the search params to the results", () => {
    const searchParams = Promise.resolve({ q: "rubric" })

    render(<Page searchParams={searchParams} />)

    expect(screen.getByRole("heading", { name: "Resources" })).toBeInTheDocument()
    expect(screen.getByText("Resource filters")).toBeInTheDocument()
    expect(screen.getByText("Resource results")).toBeInTheDocument()
    expect(ResourcesList).toHaveBeenCalledWith(expect.objectContaining({ searchParams }), undefined)
  })
})
