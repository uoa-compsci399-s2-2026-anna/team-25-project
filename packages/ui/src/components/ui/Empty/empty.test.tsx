import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "./empty"

describe("Empty", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders the composite parts together", () => {
    render(
      <Empty>
        <EmptyHeader>
          <EmptyMedia>Media</EmptyMedia>
          <EmptyTitle>Title</EmptyTitle>
          <EmptyDescription>Description</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>Content</EmptyContent>
      </Empty>,
    )

    expect(screen.getByText("Media")).toBeInTheDocument()
    expect(screen.getByText("Title")).toBeInTheDocument()
    expect(screen.getByText("Description")).toBeInTheDocument()
    expect(screen.getByText("Content")).toBeInTheDocument()
  })

  it("merges a custom className", () => {
    render(
      <Empty className="custom-class" data-testid="empty">
        Empty
      </Empty>,
    )
    expect(screen.getByTestId("empty")).toHaveClass("custom-class")
    expect(screen.getByTestId("empty")).toHaveAttribute("data-slot", "empty")
  })

  it("uses the default media variant", () => {
    render(<EmptyMedia data-testid="media">Media</EmptyMedia>)
    expect(screen.getByTestId("media")).toHaveAttribute("data-variant", "default")
    expect(screen.getByTestId("media")).toHaveClass("bg-transparent")
  })

  it("applies the icon media variant", () => {
    render(
      <EmptyMedia data-testid="media" variant="icon">
        Media
      </EmptyMedia>,
    )
    expect(screen.getByTestId("media")).toHaveAttribute("data-variant", "icon")
    expect(screen.getByTestId("media")).toHaveClass("bg-muted", "rounded-lg")
  })
})
