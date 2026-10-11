import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { PageHeader, PageHeaderSkeleton } from "./PageHeader"

afterEach(() => {
  cleanup()
})

describe("PageHeader", () => {
  it("leaves the heading's container left-aligned by default", () => {
    render(<PageHeader description="Description" title="Members" />)
    const heading = screen.getByRole("heading", { level: 1, name: "Members" })
    expect(heading.parentElement).not.toHaveClass("max-md:text-center")
  })

  it("centres the heading and description on phones when asked to", () => {
    render(<PageHeader centerOnMobile description="Description" title="Members" />)

    const heading = screen.getByRole("heading", { level: 1, name: "Members" })
    expect(heading.parentElement).toHaveClass("max-md:items-center", "max-md:text-center")
    expect(screen.getByText("Description").parentElement).toHaveClass(
      "max-md:items-center",
      "max-md:text-center",
    )
  })
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
