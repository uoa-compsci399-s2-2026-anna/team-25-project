import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ResourcePage } from "@/features/resources/components/ResourcePage"
import Page from "./page"

vi.mock("@/features/resources/components/ResourcePage", () => ({
  ResourcePage: vi.fn(() => <div>Resource content</div>),
  ResourcePageSkeleton: () => null,
}))

describe("resource detail page", () => {
  it("links back to the list and gives the route params to ResourcePage", () => {
    const params = Promise.resolve({ resourceId: "1" })

    render(<Page params={params} />)

    expect(screen.getByRole("link", { name: "Resources" })).toHaveAttribute("href", "/resources")
    expect(screen.getByText("Resource content")).toBeInTheDocument()
    expect(ResourcePage).toHaveBeenCalledWith(expect.objectContaining({ params }), undefined)
  })
})
