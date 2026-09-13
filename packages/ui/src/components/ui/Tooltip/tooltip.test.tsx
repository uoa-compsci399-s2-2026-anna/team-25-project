import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it } from "vitest"
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip"

function renderTooltip(props?: { open?: boolean; defaultOpen?: boolean }) {
  return render(
    <Tooltip {...props}>
      <TooltipTrigger delay={0}>Hover me</TooltipTrigger>
      <TooltipContent>Helpful hint</TooltipContent>
    </Tooltip>,
  )
}

describe("Tooltip", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders the trigger and keeps the content hidden until opened", () => {
    renderTooltip()
    expect(screen.getByText("Hover me")).toBeInTheDocument()
    expect(screen.queryByText("Helpful hint")).not.toBeInTheDocument()
  })

  it("shows the tooltip content when the trigger is hovered", async () => {
    const user = userEvent.setup()
    renderTooltip()
    await user.hover(screen.getByText("Hover me"))
    expect(await screen.findByText("Helpful hint")).toBeInTheDocument()
  })

  it("hides the tooltip content when the trigger is unhovered", async () => {
    const user = userEvent.setup()
    renderTooltip()
    await user.hover(screen.getByText("Hover me"))
    await screen.findByText("Helpful hint")
    await user.unhover(screen.getByText("Hover me"))
    await waitFor(() => {
      expect(screen.queryByText("Helpful hint")).not.toBeInTheDocument()
    })
  })

  it("opens the tooltip when the trigger receives keyboard focus", async () => {
    const user = userEvent.setup()
    renderTooltip()
    await user.tab()
    expect(await screen.findByText("Helpful hint")).toBeInTheDocument()
  })

  it("renders as open when defaultOpen is set", async () => {
    renderTooltip({ defaultOpen: true })
    expect(await screen.findByText("Helpful hint")).toBeInTheDocument()
  })

  it("respects a controlled open prop", () => {
    renderTooltip({ open: true })
    expect(screen.getByText("Helpful hint")).toBeInTheDocument()
  })

  it("exposes data-slot attributes on the trigger and content", async () => {
    renderTooltip({ open: true })
    expect(screen.getByText("Hover me")).toHaveAttribute("data-slot", "tooltip-trigger")
    expect(screen.getByText("Helpful hint")).toHaveAttribute("data-slot", "tooltip-content")
  })

  it("merges a custom className onto the tooltip content", () => {
    render(
      <Tooltip open>
        <TooltipTrigger delay={0}>Hover me</TooltipTrigger>
        <TooltipContent className="custom-tooltip">Helpful hint</TooltipContent>
      </Tooltip>,
    )
    expect(screen.getByText("Helpful hint")).toHaveClass("custom-tooltip")
  })

  it("forwards the side prop to the positioner", () => {
    render(
      <Tooltip open>
        <TooltipTrigger delay={0}>Hover me</TooltipTrigger>
        <TooltipContent side="right">Helpful hint</TooltipContent>
      </Tooltip>,
    )
    expect(screen.getByText("Helpful hint").closest("[data-side]")).toHaveAttribute(
      "data-side",
      "right",
    )
  })

  it("forwards the align prop to the positioner", () => {
    render(
      <Tooltip open>
        <TooltipTrigger delay={0}>Hover me</TooltipTrigger>
        <TooltipContent align="start">Helpful hint</TooltipContent>
      </Tooltip>,
    )
    expect(screen.getByText("Helpful hint").closest("[data-align]")).toHaveAttribute(
      "data-align",
      "start",
    )
  })

  it("accepts an alignOffset without breaking rendering", () => {
    // alignOffset is resolved by floating-ui into a pixel transform, which jsdom
    // can't compute (no real layout engine), so this only smoke-tests the prop.
    render(
      <Tooltip open>
        <TooltipTrigger delay={0}>Hover me</TooltipTrigger>
        <TooltipContent alignOffset={12}>Helpful hint</TooltipContent>
      </Tooltip>,
    )
    expect(screen.getByText("Helpful hint")).toBeInTheDocument()
  })
})
