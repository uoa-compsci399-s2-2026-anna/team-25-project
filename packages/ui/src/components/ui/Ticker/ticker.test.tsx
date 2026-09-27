import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { createRef } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Ticker } from "./ticker"

describe("Ticker", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders its children", () => {
    // The marquee duplicates its children internally to create a seamless
    // scrolling loop, so each item appears more than once in the DOM.
    render(
      <Ticker>
        <span>Item one</span>
        <span>Item two</span>
      </Ticker>,
    )
    expect(screen.getAllByText("Item one").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Item two").length).toBeGreaterThan(0)
  })

  it("wraps each direct child in its own flex item", () => {
    // Each item must be passed as a direct child of Ticker (not nested inside a
    // wrapping component) so the marquee can lay them out side by side - a
    // wrapping component collapses to a single item and its contents stack.
    const { container } = render(
      <Ticker>
        <span>One</span>
        <span>Two</span>
        <span>Three</span>
      </Ticker>,
    )
    const items = container.querySelectorAll(".rfm-initial-child-container > .rfm-child")
    expect(items).toHaveLength(3)
  })

  it("forwards a ref to the wrapper", () => {
    const ref = createRef<HTMLDivElement>()
    render(<Ticker ref={ref}>Content</Ticker>)
    expect(ref.current).toHaveAttribute("data-slot", "ticker")
  })

  it("exposes the ticker data-slot on the wrapper", () => {
    const { container } = render(<Ticker>Content</Ticker>)
    expect(container.querySelector('[data-slot="ticker"]')).toBeInTheDocument()
  })

  it("forwards arbitrary div props to the wrapper", () => {
    render(
      <Ticker aria-label="Announcements" data-testid="ticker">
        Content
      </Ticker>,
    )
    const wrapper = screen.getByTestId("ticker")
    expect(wrapper).toHaveAttribute("aria-label", "Announcements")
  })

  it("merges a custom className onto the wrapper", () => {
    render(
      <Ticker className="custom-ticker" data-testid="ticker">
        Content
      </Ticker>,
    )
    expect(screen.getByTestId("ticker")).toHaveClass("custom-ticker")
  })

  it("pauses on hover by default", () => {
    const { container } = render(<Ticker>Content</Ticker>)
    const marquee = container.querySelector(".rfm-marquee-container") as HTMLElement
    expect(marquee.style.getPropertyValue("--pause-on-hover")).toBe("paused")
  })

  it("lets a consumer disable pause-on-hover", () => {
    const { container } = render(<Ticker pauseOnHover={false}>Content</Ticker>)
    const marquee = container.querySelector(".rfm-marquee-container") as HTMLElement
    expect(marquee.style.getPropertyValue("--pause-on-hover")).toBe("running")
  })

  it("forwards the delay prop to the marquee track", () => {
    const { container } = render(<Ticker delay={2}>Content</Ticker>)
    const track = container.querySelector(".rfm-marquee") as HTMLElement
    expect(track.style.getPropertyValue("--delay")).toBe("2s")
  })

  it("forwards the loop prop to the marquee track", () => {
    const { container } = render(<Ticker loop={3}>Content</Ticker>)
    const track = container.querySelector(".rfm-marquee") as HTMLElement
    expect(track.style.getPropertyValue("--iteration-count")).toBe("3")
  })

  it("loops infinitely by default", () => {
    const { container } = render(<Ticker>Content</Ticker>)
    const track = container.querySelector(".rfm-marquee") as HTMLElement
    expect(track.style.getPropertyValue("--iteration-count")).toBe("infinite")
  })

  it("forwards the play prop to the marquee track", () => {
    const { container } = render(<Ticker play={false}>Content</Ticker>)
    const track = container.querySelector(".rfm-marquee") as HTMLElement
    expect(track.style.getPropertyValue("--play")).toBe("paused")
  })

  it("defaults to a left-to-right direction", () => {
    const { container } = render(<Ticker>Content</Ticker>)
    const track = container.querySelector(".rfm-marquee") as HTMLElement
    expect(track.style.getPropertyValue("--direction")).toBe("normal")
  })

  it("forwards the direction prop to the marquee track", () => {
    const { container } = render(<Ticker direction="right">Content</Ticker>)
    const track = container.querySelector(".rfm-marquee") as HTMLElement
    expect(track.style.getPropertyValue("--direction")).toBe("reverse")
  })

  it("pauses on click by default, since pauseOnHover is on", () => {
    const { container } = render(<Ticker>Content</Ticker>)
    const marquee = container.querySelector(".rfm-marquee-container") as HTMLElement
    expect(marquee.style.getPropertyValue("--pause-on-click")).toBe("paused")
  })

  it("does not pause on click once both pauseOnHover and pauseOnClick are disabled", () => {
    const { container } = render(
      <Ticker pauseOnClick={false} pauseOnHover={false}>
        Content
      </Ticker>,
    )
    const marquee = container.querySelector(".rfm-marquee-container") as HTMLElement
    expect(marquee.style.getPropertyValue("--pause-on-click")).toBe("running")
  })

  it("calls onMount once mounted", () => {
    const onMount = vi.fn()
    render(<Ticker onMount={onMount}>Content</Ticker>)
    expect(onMount).toHaveBeenCalledTimes(1)
  })

  it("calls onCycleComplete when the track finishes a loop iteration", () => {
    const onCycleComplete = vi.fn()
    const { container } = render(<Ticker onCycleComplete={onCycleComplete}>Content</Ticker>)
    const track = container.querySelector(".rfm-marquee") as HTMLElement
    fireEvent.animationIteration(track)
    expect(onCycleComplete).toHaveBeenCalledTimes(1)
  })

  it("calls onFinish when the track animation ends", () => {
    const onFinish = vi.fn()
    const { container } = render(<Ticker onFinish={onFinish}>Content</Ticker>)
    const track = container.querySelector(".rfm-marquee") as HTMLElement
    fireEvent.animationEnd(track)
    expect(onFinish).toHaveBeenCalledTimes(1)
  })

  it("renders a gradient overlay by default", () => {
    const { container } = render(<Ticker>Content</Ticker>)
    const overlay = container.querySelector(".rfm-overlay") as HTMLElement
    expect(overlay).toBeInTheDocument()
    expect(overlay.style.getPropertyValue("--gradient-color")).toBe("var(--color-background)")
    expect(overlay.style.getPropertyValue("--gradient-width")).toBe("80px")
  })

  it("lets a consumer disable the gradient overlay", () => {
    const { container } = render(<Ticker gradient={false}>Content</Ticker>)
    expect(container.querySelector(".rfm-overlay")).not.toBeInTheDocument()
  })

  it("lets a consumer override the gradient color and width", () => {
    const { container } = render(
      <Ticker gradientColor="red" gradientWidth={64}>
        Content
      </Ticker>,
    )
    const overlay = container.querySelector(".rfm-overlay") as HTMLElement
    expect(overlay.style.getPropertyValue("--gradient-color")).toBe("red")
    expect(overlay.style.getPropertyValue("--gradient-width")).toBe("64px")
  })
})
