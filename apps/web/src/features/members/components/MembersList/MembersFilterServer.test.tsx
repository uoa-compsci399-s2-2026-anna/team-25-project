import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { MembersFilterServerSkeleton } from "./MembersFilterServer"

// The skeleton never reads data; the query module is stubbed so it doesn't load Payload.
vi.mock("@/features/institutions/institutions.queries", () => ({}))

describe("MembersFilterServerSkeleton", () => {
  it("renders a filter bar placeholder with the bar's three filters and no status tabs", () => {
    const { container } = render(<MembersFilterServerSkeleton />)

    expect(container.querySelectorAll('[data-slot="filter-bar-skeleton-filter"]')).toHaveLength(3)
    expect(container.querySelector('[data-slot="filter-bar-skeleton-status"]')).toBeNull()
  })
})
