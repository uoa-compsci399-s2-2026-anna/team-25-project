import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Heading } from "./heading"

describe("Heading", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders children", () => {
    render(<Heading>Title</Heading>)
    expect(screen.getByText("Title")).toBeInTheDocument()
  })

  it("renders an h1 tag by default", () => {
    render(<Heading>Title</Heading>)
    expect(screen.getByRole("heading", { level: 1, name: "Title" })).toBeInTheDocument()
  })

  it("renders the tag matching the level prop", () => {
    render(<Heading level="h3">Title</Heading>)
    expect(screen.getByRole("heading", { level: 3, name: "Title" })).toBeInTheDocument()
  })

  it("applies level variant classes", () => {
    render(<Heading level="h2">Title</Heading>)
    expect(screen.getByText("Title")).toHaveClass("text-2xl", "md:text-3xl", "font-semibold")
  })

  it("merges a custom className with variant classes", () => {
    render(
      <Heading className="custom-class" level="h2">
        Title
      </Heading>,
    )
    expect(screen.getByText("Title")).toHaveClass(
      "custom-class",
      "text-2xl",
      "md:text-3xl",
      "font-semibold",
    )
  })

  it("passes through extra props via ...props", () => {
    render(
      <Heading aria-label="Page title" data-testid="heading" title="Tooltip text">
        Title
      </Heading>,
    )
    const el = screen.getByTestId("heading")
    expect(el).toHaveAttribute("aria-label", "Page title")
    expect(el).toHaveAttribute("title", "Tooltip text")
  })

  it("renders as a different element when the render prop is passed, keeping level styling", () => {
    render(<Heading level="h3" render={<h1>Title</h1>} />)
    const el = screen.getByRole("heading", { level: 1, name: "Title" })
    expect(el).toBeInTheDocument()
    expect(el).toHaveClass("text-xl", "md:text-2xl", "font-semibold")
  })
})
