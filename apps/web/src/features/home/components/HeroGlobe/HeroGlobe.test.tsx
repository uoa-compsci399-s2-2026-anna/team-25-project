import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import createGlobe from "cobe"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { HeroGlobe } from "./HeroGlobe"
import { GLOBE_MARKERS } from "./useGlobe"

const { update, destroy } = vi.hoisted(() => ({ update: vi.fn(), destroy: vi.fn() }))

// cobe needs WebGL, which jsdom doesn't have, so stand in a fake globe.
vi.mock("cobe", () => ({ default: vi.fn(() => ({ update, destroy })) }))

// Mirrors MAX_TILT in useGlobe.ts.
const MAX_TILT = 1.2

const dragUpdates = () =>
  update.mock.calls.map(([options]) => options).filter((options) => "phi" in options)

describe("HeroGlobe", () => {
  beforeAll(() => {
    // jsdom doesn't implement pointer capture.
    HTMLCanvasElement.prototype.setPointerCapture = vi.fn()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  describe("labels", () => {
    it.each(GLOBE_MARKERS)("renders the $label label", ({ label }) => {
      render(<HeroGlobe />)
      expect(screen.getByText(label)).toBeInTheDocument()
    })

    it.each(GLOBE_MARKERS)("ties the $label label's visibility to its marker", ({ id, label }) => {
      render(<HeroGlobe />)
      const style = screen.getByText(label).style
      expect(style.getPropertyValue("opacity")).toBe(`var(--cobe-visible-${id}, 0)`)
      expect(style.getPropertyValue("filter")).toContain(`var(--cobe-visible-${id}, 0)`)
    })

    it("doesn't let the labels block dragging", () => {
      render(<HeroGlobe />)
      for (const { label } of GLOBE_MARKERS) {
        expect(screen.getByText(label)).toHaveClass("pointer-events-none")
      }
    })
  })

  it("renders the canvas with an accessible name", () => {
    render(<HeroGlobe />)
    expect(screen.getByLabelText("Globe - drag to rotate").tagName).toBe("CANVAS")
  })

  describe("globe", () => {
    it("creates the globe on the canvas with a marker for each label", () => {
      render(<HeroGlobe />)
      expect(createGlobe).toHaveBeenCalledOnce()
      const [canvas, options] = vi.mocked(createGlobe).mock.calls[0]
      expect(canvas).toBe(screen.getByLabelText("Globe - drag to rotate"))
      expect(options.markers).toEqual(
        GLOBE_MARKERS.map(({ id, location }) => expect.objectContaining({ id, location })),
      )
    })

    it("destroys the globe on unmount", () => {
      const { unmount } = render(<HeroGlobe />)
      unmount()
      expect(destroy).toHaveBeenCalledOnce()
    })

    it("rotates the globe when dragged", () => {
      render(<HeroGlobe />)
      const canvas = screen.getByLabelText("Globe - drag to rotate")
      fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 })
      fireEvent.pointerMove(canvas, { clientX: 50, clientY: 20 })
      expect(dragUpdates()).toEqual([{ phi: expect.any(Number), theta: expect.any(Number) }])
    })

    it("clamps the tilt so the globe can't flip over a pole", () => {
      render(<HeroGlobe />)
      const canvas = screen.getByLabelText("Globe - drag to rotate")
      fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 })
      fireEvent.pointerMove(canvas, { clientX: 0, clientY: 10000 })
      fireEvent.pointerMove(canvas, { clientX: 0, clientY: -10000 })
      const [down, up] = dragUpdates()
      expect(down.theta).toBe(MAX_TILT)
      expect(up.theta).toBe(-MAX_TILT)
    })

    it("ignores pointer moves without a drag", () => {
      render(<HeroGlobe />)
      const canvas = screen.getByLabelText("Globe - drag to rotate")
      fireEvent.pointerMove(canvas, { clientX: 50, clientY: 20 })
      fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 })
      fireEvent.pointerUp(canvas)
      fireEvent.pointerMove(canvas, { clientX: 50, clientY: 20 })
      expect(dragUpdates()).toEqual([])
    })
  })
})
