import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "./collapsible"

describe("Collapsible", () => {
  afterEach(() => {
    cleanup()
  })

  it("hides the panel until the trigger is clicked", () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Show details</CollapsibleTrigger>
        <CollapsiblePanel>Details</CollapsiblePanel>
      </Collapsible>,
    )
    const trigger = screen.getByRole("button", { name: "Show details" })
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByText("Details")).not.toBeInTheDocument()

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByText("Details")).toBeInTheDocument()
  })

  it("supports controlled state", () => {
    const onOpenChange = vi.fn()
    render(
      <Collapsible onOpenChange={onOpenChange} open>
        <CollapsibleTrigger>Show details</CollapsibleTrigger>
        <CollapsiblePanel>Details</CollapsiblePanel>
      </Collapsible>,
    )
    expect(screen.getByText("Details")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Show details" }))
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
  })
})
