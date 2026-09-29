import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { MembersHeaderSkeleton } from "./MembersHeader"

// The skeleton never reads data; the query modules are stubbed so they don't load Payload.
vi.mock("../members.queries", () => ({}))
vi.mock("@/features/institutions/institutions.queries", () => ({}))

describe("MembersHeaderSkeleton", () => {
  it("renders the real heading, with placeholders for the counts", () => {
    const { container } = render(<MembersHeaderSkeleton />)

    expect(screen.getByRole("heading", { level: 1, name: "Members" })).toBeInTheDocument()
    expect(screen.queryByText(/academics who teach/)).not.toBeInTheDocument()
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3)
  })
})
