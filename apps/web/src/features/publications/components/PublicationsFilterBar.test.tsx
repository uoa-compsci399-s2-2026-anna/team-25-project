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
    // The chips below the bar name the picked tags; the trigger keeps its placeholder.
    expect(screen.getByRole("combobox", { name: "Tags" })).toHaveTextContent("Tags")
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

  it("disables the unpicked tags once the cap is reached", async () => {
    const user = userEvent.setup()
    render(<PublicationsFilterBar tags={["a", "b", "c", "d", "e", "f", "g"]} years={[]} />, {
      wrapper: withNuqsTestingAdapter({ searchParams: "?tags=a,b,c,d,e,f" }),
    })

    await user.click(screen.getByRole("combobox", { name: "Tags" }))
    await screen.findByRole("listbox")
    expect(screen.getByRole("option", { name: "a" })).not.toHaveAttribute("data-disabled")
    expect(screen.getByRole("option", { name: "g" })).toHaveAttribute("data-disabled")
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
