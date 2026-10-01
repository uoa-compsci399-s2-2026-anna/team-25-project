import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { type OnUrlUpdateFunction, withNuqsTestingAdapter } from "nuqs/adapters/testing"
import { afterEach, describe, expect, it, vi } from "vitest"
import { PublicationsFilterBar } from "./PublicationsFilterBar"

const renderFilterBar = (searchParams = "") => {
  const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
  render(<PublicationsFilterBar tags={["Assessment", "Teamwork"]} years={[2025, 2024]} />, {
    wrapper: withNuqsTestingAdapter({ onUrlUpdate, searchParams }),
  })
  return onUrlUpdate
}

describe("PublicationsFilterBar", () => {
  afterEach(() => {
    cleanup()
  })

  it("shows the URL filters and the year options", async () => {
    const user = userEvent.setup()
    renderFilterBar("?q=capstone&type=phdthesis&year=2024&tags=Teamwork&sort=titleAsc&page=3")

    expect(screen.getByRole("searchbox", { name: "Search publications..." })).toHaveValue(
      "capstone",
    )
    expect(screen.getByRole("combobox", { name: "Type" })).toHaveTextContent("PhD thesis")
    expect(screen.getByRole("combobox", { name: "Year" })).toHaveTextContent("2024")
    expect(screen.getByRole("combobox", { name: "Tags" })).toHaveTextContent("Teamwork")
    expect(screen.getByRole("combobox", { name: "Sort" })).toHaveTextContent("Title A-Z")

    await user.click(screen.getByRole("combobox", { name: "Year" }))
    await screen.findByRole("listbox")
    expect(screen.getByRole("option", { name: "2025" })).toBeInTheDocument()
  })

  it("updates filters and sort while resetting the page", async () => {
    const user = userEvent.setup()
    const onUrlUpdate = renderFilterBar("?page=3")

    await user.click(screen.getByRole("combobox", { name: "Type" }))
    await screen.findByRole("listbox")
    await user.click(screen.getByRole("option", { name: "Journal article" }))
    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryString: "?type=article" }),
    )

    await user.click(screen.getByRole("combobox", { name: "Year" }))
    await screen.findByRole("listbox")
    await user.click(screen.getByRole("option", { name: "2025" }))
    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryString: "?year=2025" }),
    )

    await user.click(screen.getByRole("combobox", { name: "Sort" }))
    await screen.findByRole("listbox")
    await user.click(screen.getByRole("option", { name: "Oldest first" }))
    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryString: "?sort=oldest" }),
    )
  })

  it("adds and removes tags while resetting the page", async () => {
    const user = userEvent.setup()
    const onUrlUpdate = renderFilterBar("?tags=Teamwork&page=3")

    await user.click(screen.getByRole("combobox", { name: "Tags" }))
    await screen.findByRole("listbox")
    await user.click(screen.getByRole("option", { name: "Assessment" }))
    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryString: "?tags=Teamwork,Assessment" }),
    )

    await user.click(screen.getByRole("option", { name: "Teamwork" }))
    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryString: "?tags=Assessment" }),
    )

    await user.click(screen.getByRole("option", { name: "Assessment" }))
    expect(onUrlUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ queryString: "" }))
  })

  it("applies search text after the debounce", async () => {
    const user = userEvent.setup()
    const onUrlUpdate = renderFilterBar()

    await user.type(screen.getByRole("searchbox", { name: "Search publications..." }), "peer")
    await waitFor(
      () => {
        expect(onUrlUpdate).toHaveBeenLastCalledWith(
          expect.objectContaining({ queryString: "?q=peer" }),
        )
      },
      { timeout: 1000 },
    )
  })

  it("clears search text and resets the page immediately", async () => {
    const user = userEvent.setup()
    const onUrlUpdate = renderFilterBar("?q=peer&page=3")

    await user.clear(screen.getByRole("searchbox", { name: "Search publications..." }))
    expect(onUrlUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ queryString: "" }))
  })
})
