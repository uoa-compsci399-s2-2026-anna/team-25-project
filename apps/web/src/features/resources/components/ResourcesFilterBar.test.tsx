import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { type OnUrlUpdateFunction, withNuqsTestingAdapter } from "nuqs/adapters/testing"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ResourcesFilterBar } from "./ResourcesFilterBar"

const courses = [
  { label: "COMPSCI 399 - University of Auckland", value: 9 },
  { label: "SE 101 - University of Canterbury", value: 4 },
]
const institutions = [
  { label: "University of Auckland", value: 12 },
  { label: "University of Canterbury", value: 3 },
]

const renderFilterBar = (searchParams = "") => {
  const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
  render(<ResourcesFilterBar courses={courses} institutions={institutions} />, {
    wrapper: withNuqsTestingAdapter({ onUrlUpdate, searchParams }),
  })
  return onUrlUpdate
}

describe("ResourcesFilterBar", () => {
  afterEach(() => {
    cleanup()
  })

  it("shows the URL filters", () => {
    renderFilterBar("?q=rubric&course=4&institution=12&sort=titleAsc&page=3")

    expect(screen.getByRole("searchbox", { name: "Search resources..." })).toHaveValue("rubric")
    expect(screen.getByRole("combobox", { name: "Course" })).toHaveTextContent(
      "SE 101 - University of Canterbury",
    )
    expect(screen.getByRole("combobox", { name: "University" })).toHaveTextContent(
      "University of Auckland",
    )
    expect(screen.getByRole("combobox", { name: "Sort" })).toHaveTextContent("Title A-Z")
  })

  it("updates filters and sort while resetting the page", async () => {
    const user = userEvent.setup()
    const onUrlUpdate = renderFilterBar("?page=3")

    await user.click(screen.getByRole("combobox", { name: "Course" }))
    await screen.findByRole("listbox")
    await user.click(screen.getByRole("option", { name: "COMPSCI 399 - University of Auckland" }))
    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryString: "?course=9" }),
    )

    await user.click(screen.getByRole("combobox", { name: "University" }))
    await screen.findByRole("listbox")
    await user.click(screen.getByRole("option", { name: "University of Canterbury" }))
    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryString: "?institution=3" }),
    )

    await user.click(screen.getByRole("combobox", { name: "Sort" }))
    await screen.findByRole("listbox")
    await user.click(screen.getByRole("option", { name: "Oldest first" }))
    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryString: "?sort=oldest" }),
    )
  })

  it("searches by text, resetting the page", async () => {
    const user = userEvent.setup()
    const onUrlUpdate = renderFilterBar("?page=3")

    // Pasted rather than typed, so the debounce restarts once, not once per key. The wait
    // allows for a slow CI runner under coverage; it returns as soon as the URL updates.
    await user.click(screen.getByRole("searchbox", { name: "Search resources..." }))
    await user.paste("rubric")

    await vi.waitFor(
      () =>
        expect(onUrlUpdate).toHaveBeenLastCalledWith(
          expect.objectContaining({ queryString: "?q=rubric" }),
        ),
      { timeout: 3000 },
    )
  })
})
