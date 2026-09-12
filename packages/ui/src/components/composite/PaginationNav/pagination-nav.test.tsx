import { cleanup, render, screen } from "@testing-library/react"
import type * as React from "react"
import { afterEach, describe, expect, it } from "vitest"
import { getPageRange, PaginationNav } from "./pagination-nav"

const getHref = (page: number) => `/proposals?page=${page}`

describe("getPageRange", () => {
  it.each([
    [1, 1, [1]],
    [1, 2, [1, 2]],
    [4, 7, [1, 2, 3, 4, 5, 6, 7]],
    [1, 12, [1, 2, "ellipsis", 12]],
    [3, 12, [1, 2, 3, 4, "ellipsis", 12]],
    [6, 12, [1, "ellipsis", 5, 6, 7, "ellipsis", 12]],
    [10, 12, [1, "ellipsis", 9, 10, 11, 12]],
    [12, 12, [1, "ellipsis", 11, 12]],
  ])("gives page %i of %i as %j", (page, totalPages, expected) => {
    expect(getPageRange(page, totalPages)).toEqual(expected)
  })
})

describe("PaginationNav", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders nothing for a single page", () => {
    const { container } = render(<PaginationNav getHref={getHref} page={1} totalPages={1} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("links each page and marks the current one", () => {
    render(<PaginationNav getHref={getHref} page={2} totalPages={3} />)
    expect(screen.getByRole("link", { name: "1" })).toHaveAttribute("href", "/proposals?page=1")
    expect(screen.getByRole("link", { name: "2" })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("link", { name: "3" })).toHaveAttribute("href", "/proposals?page=3")
    expect(screen.getByRole("link", { name: "Go to previous page" })).toHaveAttribute(
      "href",
      "/proposals?page=1",
    )
    expect(screen.getByRole("link", { name: "Go to next page" })).toHaveAttribute(
      "href",
      "/proposals?page=3",
    )
  })

  it("disables previous on the first page", () => {
    render(<PaginationNav getHref={getHref} page={1} totalPages={3} />)
    expect(screen.queryByRole("link", { name: "Go to previous page" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Go to previous page" })).toBeDisabled()
  })

  it("disables next on the last page", () => {
    render(<PaginationNav getHref={getHref} page={3} totalPages={3} />)
    expect(screen.queryByRole("link", { name: "Go to next page" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Go to next page" })).toBeDisabled()
  })

  it("renders the links through a custom link component", () => {
    const CustomLink = ({ children, ...linkProps }: React.ComponentProps<"a">) => (
      <a data-testid="custom-link" {...linkProps}>
        {children}
      </a>
    )
    render(<PaginationNav getHref={getHref} linkComponent={CustomLink} page={1} totalPages={2} />)
    // Pages 1 and 2, plus next.
    expect(screen.getAllByTestId("custom-link")).toHaveLength(3)
  })
})
