import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { type OnUrlUpdateFunction, withNuqsTestingAdapter } from "nuqs/adapters/testing"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ResourcesActiveFilters } from "./ResourcesActiveFilters"

const courses = [{ label: "SE 101 - University of Canterbury", value: 4 }]
const institutions = [{ label: "University of Auckland", value: 12 }]

const renderActiveFilters = (searchParams = "") => {
  const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
  render(<ResourcesActiveFilters courses={courses} institutions={institutions} />, {
    wrapper: withNuqsTestingAdapter({ onUrlUpdate, searchParams }),
  })
  return onUrlUpdate
}

describe("ResourcesActiveFilters", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders nothing when no filter is set", () => {
    renderActiveFilters("?q=rubric&sort=titleAsc")

    expect(screen.queryByText("Active filters")).not.toBeInTheDocument()
  })

  it("names each active filter", () => {
    renderActiveFilters("?course=4&institution=12")

    expect(screen.getByText("SE 101 - University of Canterbury")).toBeInTheDocument()
    expect(screen.getByText("University of Auckland")).toBeInTheDocument()
  })

  it("keeps a chip for an id with no matching option, so it stays removable", () => {
    renderActiveFilters("?course=99&institution=98")

    expect(screen.getByText("Unknown course")).toBeInTheDocument()
    expect(screen.getByText("Unknown university")).toBeInTheDocument()
  })

  it("removes one filter and goes back to the first page", async () => {
    const user = userEvent.setup()
    const onUrlUpdate = renderActiveFilters("?course=4&institution=12&page=3")

    await user.click(
      screen.getByRole("button", { name: "Remove SE 101 - University of Canterbury filter" }),
    )

    expect(onUrlUpdate.mock.lastCall?.[0].queryString).toBe("?institution=12")
  })

  it("clears every filter and the search", async () => {
    const user = userEvent.setup()
    const onUrlUpdate = renderActiveFilters("?course=4&institution=12&q=rubric&sort=titleAsc")

    await user.click(screen.getByRole("button", { name: "Clear all" }))

    expect(onUrlUpdate.mock.lastCall?.[0].queryString).toBe("?sort=titleAsc")
  })
})
