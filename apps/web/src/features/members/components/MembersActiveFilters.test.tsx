import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { type OnUrlUpdateFunction, withNuqsTestingAdapter } from "nuqs/adapters/testing"
import { afterEach, describe, expect, it, vi } from "vitest"
import { MembersActiveFilters } from "./MembersActiveFilters"

const institutions = [
  { label: "University of Auckland", value: 12 },
  { label: "University of Canterbury", value: 3 },
]

const renderActiveFilters = (searchParams = "") => {
  const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
  render(<MembersActiveFilters institutions={institutions} />, {
    wrapper: withNuqsTestingAdapter({ onUrlUpdate, searchParams }),
  })
  return onUrlUpdate
}

describe("MembersActiveFilters", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders nothing when no filter is set", () => {
    renderActiveFilters("?q=tui&sort=surnameDesc")

    expect(screen.queryByText("Active filters")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Clear all" })).not.toBeInTheDocument()
  })

  it("names each active filter", () => {
    renderActiveFilters("?institution=12&country=NZ")

    expect(screen.getByText("Active filters")).toBeInTheDocument()
    expect(screen.getByText("University of Auckland")).toBeInTheDocument()
    expect(screen.getByText("New Zealand")).toBeInTheDocument()
  })

  it("removes one filter and leaves the others alone", async () => {
    const user = userEvent.setup()
    const onUrlUpdate = renderActiveFilters("?institution=12&country=NZ&q=tui")

    await user.click(screen.getByRole("button", { name: "Remove New Zealand filter" }))

    const { queryString } = onUrlUpdate.mock.lastCall?.[0] ?? {}
    expect(queryString).toContain("institution=12")
    expect(queryString).toContain("q=tui")
    expect(queryString).not.toContain("country")
  })

  it("goes back to the first page when a filter is removed", async () => {
    const user = userEvent.setup()
    const onUrlUpdate = renderActiveFilters("?country=NZ&page=4")

    await user.click(screen.getByRole("button", { name: "Remove New Zealand filter" }))

    // Dropping a filter lengthens the list, so page 4 may no longer exist.
    expect(onUrlUpdate.mock.lastCall?.[0].queryString).not.toContain("page")
  })

  it("clears every filter, the search included", async () => {
    const user = userEvent.setup()
    const onUrlUpdate = renderActiveFilters(
      "?institution=12&country=NZ&q=tui&sort=surnameDesc&page=4",
    )

    await user.click(screen.getByRole("button", { name: "Clear all" }))

    const { queryString } = onUrlUpdate.mock.lastCall?.[0] ?? {}
    expect(queryString).not.toContain("institution")
    expect(queryString).not.toContain("country")
    expect(queryString).not.toContain("q=")
    expect(queryString).not.toContain("page")
    // Sort is an ordering, not a filter, so "clear all" leaves it where the reader put it.
    expect(queryString).toContain("sort=surnameDesc")
  })

  it("still offers to remove an institution id that matches nothing", async () => {
    const user = userEvent.setup()
    const onUrlUpdate = renderActiveFilters("?institution=999")

    expect(screen.getByText("Unknown university")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Remove Unknown university filter" }))
    expect(onUrlUpdate.mock.lastCall?.[0].queryString).not.toContain("institution")
  })
})
