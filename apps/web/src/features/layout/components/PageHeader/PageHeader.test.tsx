import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { PageHeaderSkeleton } from "./PageHeader"

afterEach(() => {
  cleanup()
})

describe("PageHeaderSkeleton", () => {
  it("renders the real title, with two placeholder lines for the description", () => {
    const { container } = render(<PageHeaderSkeleton title="Members" />)

    expect(screen.getByRole("heading", { level: 1, name: "Members" })).toBeInTheDocument()
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(2)
  })

  it("renders a static description in place of the placeholder lines", () => {
    const { container } = render(<PageHeaderSkeleton description="Known text" title="Courses" />)

    expect(screen.getByText("Known text")).toBeInTheDocument()
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(0)
  })

  it("renders actions beside the description", () => {
    render(<PageHeaderSkeleton actions={<button type="button">Act</button>} title="Courses" />)
    expect(screen.getByRole("button", { name: "Act" })).toBeInTheDocument()
  })
})
