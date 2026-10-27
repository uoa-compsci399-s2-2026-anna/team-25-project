import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Routes } from "@/lib/routes"
import { FiltersUnavailable } from "./FiltersUnavailable"

const searchParams = vi.hoisted(() => ({ current: new URLSearchParams() }))
vi.mock("next/navigation", () => ({ useSearchParams: () => searchParams.current }))

describe("FiltersUnavailable", () => {
  afterEach(() => {
    cleanup()
  })

  it("shows nothing when no filter is in the URL", () => {
    searchParams.current = new URLSearchParams("page=2")
    const { container } = render(<FiltersUnavailable clearHref={Routes.MEMBERS.ROOT} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("links to the unfiltered page when a filter is in the URL", () => {
    searchParams.current = new URLSearchParams("institution=5")
    render(<FiltersUnavailable clearHref={Routes.MEMBERS.ROOT} />)
    expect(screen.getByRole("link", { name: "Clear filters" })).toHaveAttribute(
      "href",
      Routes.MEMBERS.ROOT,
    )
  })
})
