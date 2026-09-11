import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination"

describe("Pagination", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders a labelled navigation list", () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="?page=1">1</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    )
    expect(screen.getByRole("navigation", { name: "pagination" })).toBeInTheDocument()
    expect(screen.getByRole("listitem")).toBeInTheDocument()
  })

  it("marks the active link as the current page", () => {
    render(
      <>
        <PaginationLink href="?page=1">1</PaginationLink>
        <PaginationLink href="?page=2" isActive>
          2
        </PaginationLink>
      </>,
    )
    expect(screen.getByRole("link", { name: "1" })).not.toHaveAttribute("aria-current")
    expect(screen.getByRole("link", { name: "1" })).toHaveClass("bg-transparent")
    expect(screen.getByRole("link", { name: "2" })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("link", { name: "2" })).toHaveClass("bg-brand-charcoal")
  })

  it("renders through a custom element", () => {
    render(<PaginationLink render={<a data-testid="custom" href="/custom" />}>3</PaginationLink>)
    expect(screen.getByTestId("custom")).toHaveAttribute("href", "/custom")
    expect(screen.getByTestId("custom")).toHaveTextContent("3")
  })

  it("labels the previous and next links", () => {
    render(
      <>
        <PaginationPrevious href="?page=1" />
        <PaginationNext href="?page=3" />
      </>,
    )
    expect(screen.getByRole("link", { name: "Go to previous page" })).toHaveAttribute(
      "href",
      "?page=1",
    )
    expect(screen.getByRole("link", { name: "Go to next page" })).toHaveAttribute("href", "?page=3")
  })

  it("hides the ellipsis from assistive technology", () => {
    const { container } = render(<PaginationEllipsis />)
    expect(container.firstChild).toHaveAttribute("aria-hidden")
  })
})
