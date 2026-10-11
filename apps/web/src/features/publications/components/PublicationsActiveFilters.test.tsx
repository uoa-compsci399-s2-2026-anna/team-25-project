import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { type OnUrlUpdateFunction, withNuqsTestingAdapter } from "nuqs/adapters/testing"
import { afterEach, describe, expect, it, vi } from "vitest"
import { PUBLICATION_TAG_FILTER_MAX } from "../publications.search-params"
import { PublicationsActiveFilters } from "./PublicationsActiveFilters"

const renderActiveFilters = (searchParams = "") => {
  const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
  render(<PublicationsActiveFilters />, {
    wrapper: withNuqsTestingAdapter({ onUrlUpdate, searchParams }),
  })
  return onUrlUpdate
}

describe("PublicationsActiveFilters", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders nothing when no filter is set", () => {
    renderActiveFilters("?q=capstone&sort=oldest")

    expect(screen.queryByText("Active filters")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Clear all" })).not.toBeInTheDocument()
  })

  it("names each active filter", () => {
    renderActiveFilters("?type=phdthesis&year=2024&tags=Teamwork,Assessment")

    expect(screen.getByText("Active filters")).toBeInTheDocument()
    expect(screen.getByText("PhD thesis")).toBeInTheDocument()
    expect(screen.getByText("2024")).toBeInTheDocument()
    expect(screen.getByText("Teamwork")).toBeInTheDocument()
    expect(screen.getByText("Assessment")).toBeInTheDocument()
  })

  it("removes one filter and leaves the others alone", async () => {
    const user = userEvent.setup()
    const onUrlUpdate = renderActiveFilters("?type=phdthesis&year=2024&q=peer")

    await user.click(screen.getByRole("button", { name: "Remove 2024 filter" }))

    const { queryString } = onUrlUpdate.mock.lastCall?.[0] ?? {}
    expect(queryString).toContain("type=phdthesis")
    expect(queryString).toContain("q=peer")
    expect(queryString).not.toContain("year")
  })

  it("removes one tag and keeps the rest", async () => {
    const user = userEvent.setup()
    const onUrlUpdate = renderActiveFilters("?tags=Teamwork,Assessment&year=2024")

    await user.click(screen.getByRole("button", { name: "Remove Teamwork filter" }))

    const { queryString } = onUrlUpdate.mock.lastCall?.[0] ?? {}
    expect(queryString).toContain("tags=Assessment")
    expect(queryString).not.toContain("Teamwork")
    expect(queryString).toContain("year=2024")
  })

  it("goes back to the first page when a filter is removed", async () => {
    const user = userEvent.setup()
    const onUrlUpdate = renderActiveFilters("?year=2024&page=4")

    await user.click(screen.getByRole("button", { name: "Remove 2024 filter" }))

    // Dropping a filter lengthens the list, so page 4 may no longer exist.
    expect(onUrlUpdate.mock.lastCall?.[0].queryString).not.toContain("page")
  })

  it("clears every filter, the search included", async () => {
    const user = userEvent.setup()
    const onUrlUpdate = renderActiveFilters(
      "?type=phdthesis&year=2024&tags=Teamwork,Assessment&q=peer&sort=oldest&page=4",
    )

    await user.click(screen.getByRole("button", { name: "Clear all" }))

    // Sort is an ordering, not a filter, so "clear all" leaves it where the reader put it.
    expect(onUrlUpdate.mock.lastCall?.[0].queryString).toBe("?sort=oldest")
  })

  // "?tags=" parses to [""], which would otherwise show a blank chip.
  it.each(["?tags=", "?tags=%20%20"])("ignores an empty tag in %s", (search) => {
    renderActiveFilters(search)

    expect(screen.queryByText("Active filters")).not.toBeInTheDocument()
  })

  // The query takes only the first six, so showing more would overstate what is filtering.
  it("shows no more tag chips than the query applies", () => {
    renderActiveFilters("?tags=a,b,c,d,e,f,g,h")

    expect(screen.getAllByRole("button", { name: /^Remove . filter$/ })).toHaveLength(
      PUBLICATION_TAG_FILTER_MAX,
    )
  })

  // The bar cannot unpick a tag that is not one of its options, such as a renamed one.
  it("still offers to remove a tag that no publication has", async () => {
    const user = userEvent.setup()
    const onUrlUpdate = renderActiveFilters("?tags=Retired")

    await user.click(screen.getByRole("button", { name: "Remove Retired filter" }))
    expect(onUrlUpdate.mock.lastCall?.[0].queryString).toBe("")
  })
})
