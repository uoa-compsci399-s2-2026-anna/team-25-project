import { ProposalStatus } from "@repo/shared/enums/proposals"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { type OnUrlUpdateFunction, withNuqsTestingAdapter } from "nuqs/adapters/testing"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ProposalsFilterBar } from "./ProposalsFilterBar"

const counts = {
  [ProposalStatus.ACTIVE]: 27,
  [ProposalStatus.CLOSED]: 14,
}

const renderFilterBar = (searchParams = "") => {
  const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
  render(
    <ProposalsFilterBar
      counts={counts}
      institutions={[
        { label: "University of Auckland", value: 12 },
        { label: "University of Canterbury", value: 3 },
      ]}
    />,
    { wrapper: withNuqsTestingAdapter({ onUrlUpdate, searchParams }) },
  )
  return onUrlUpdate
}

describe("ProposalsFilterBar", () => {
  afterEach(() => {
    cleanup()
  })

  it("shows URL filters, status counts and institution options", async () => {
    const user = userEvent.setup()
    renderFilterBar("?status=closed&q=peer&institution=12&tag=assessment&sort=oldest&page=3")

    expect(screen.getByRole("tab", { name: "Closed - 14" })).toHaveAttribute(
      "aria-selected",
      "true",
    )
    expect(screen.getByRole("tab", { name: "All" })).toBeInTheDocument()
    expect(screen.getByRole("searchbox", { name: "Search proposals..." })).toHaveValue("peer")
    expect(screen.getByRole("combobox", { name: "University" })).toHaveTextContent(
      "University of Auckland",
    )
    expect(screen.getByRole("combobox", { name: "Interest area" })).toHaveTextContent("Assessment")
    expect(screen.getByRole("combobox", { name: "Sort" })).toHaveTextContent("Oldest first")

    await user.click(screen.getByRole("combobox", { name: "University" }))
    await screen.findByRole("listbox")
    expect(screen.getByRole("option", { name: "University of Canterbury" })).toBeInTheDocument()
  })

  it("updates status, filters and sort while resetting the page", async () => {
    const user = userEvent.setup()
    const onUrlUpdate = renderFilterBar("?page=3")

    await user.click(screen.getByRole("tab", { name: "Closed - 14" }))
    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryString: "?status=closed" }),
    )

    await user.click(screen.getByRole("combobox", { name: "University" }))
    await screen.findByRole("listbox")
    await user.click(screen.getByRole("option", { name: "University of Canterbury" }))
    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryString: "?institution=3" }),
    )

    await user.click(screen.getByRole("combobox", { name: "Interest area" }))
    await screen.findByRole("listbox")
    await user.click(screen.getByRole("option", { name: "Assessment" }))
    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryString: "?tag=assessment" }),
    )

    await user.click(screen.getByRole("combobox", { name: "Sort" }))
    await screen.findByRole("listbox")
    await user.click(screen.getByRole("option", { name: "Oldest first" }))
    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryString: "?sort=oldest" }),
    )
  })

  it("applies search text after the debounce", async () => {
    const user = userEvent.setup()
    const onUrlUpdate = renderFilterBar()
    const search = screen.getByRole("searchbox", { name: "Search proposals..." })

    await user.type(search, "peer")
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
    const search = screen.getByRole("searchbox", { name: "Search proposals..." })

    await user.clear(search)
    expect(onUrlUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ queryString: "" }))
  })
})
