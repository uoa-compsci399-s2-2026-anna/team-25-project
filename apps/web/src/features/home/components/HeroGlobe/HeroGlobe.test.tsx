import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import createGlobe from "cobe"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import type { GlobeMarker } from "../../globe.queries"
import { HeroGlobe } from "./HeroGlobe"

const { update, destroy } = vi.hoisted(() => ({ update: vi.fn(), destroy: vi.fn() }))

// cobe needs WebGL, which jsdom doesn't have, so stand in a fake globe.
vi.mock("cobe", () => ({ default: vi.fn(() => ({ update, destroy })) }))

const MARKERS: GlobeMarker[] = [
  { id: "institution-1", location: [-36.8523, 174.769], label: "University of Auckland" },
  { id: "institution-2", location: [-33.9173, 151.2313], label: "UNSW Sydney" },
]

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
    it.each(MARKERS)("renders the $label label", ({ label }) => {
      render(<HeroGlobe markers={MARKERS} />)
      expect(screen.getByText(label)).toBeInTheDocument()
    })

    it.each(MARKERS)("hides the $label label until its marker is hovered", ({ label }) => {
      render(<HeroGlobe markers={MARKERS} />)
      expect(screen.getByText(label).style.getPropertyValue("opacity")).toBe("0")
    })

    it.each(MARKERS)("shows the $label label while its marker is hovered", ({ id, label }) => {
      render(<HeroGlobe markers={MARKERS} />)
      const marker = screen.getByTestId(`marker-pulse-${id}`)
      fireEvent.pointerEnter(marker)
      // Still tied to the marker's visibility, so it fades out on the far side of the globe.
      const style = screen.getByText(label).style
      expect(style.getPropertyValue("opacity")).toBe(`var(--cobe-visible-${id}, 0)`)
      expect(style.getPropertyValue("filter")).toContain(`var(--cobe-visible-${id}, 0)`)
      fireEvent.pointerLeave(marker)
      expect(style.getPropertyValue("opacity")).toBe("0")
    })

    it("shows both labels when hovering markers that sit on the same spot", () => {
      const overlapping: GlobeMarker[] = [
        ...MARKERS,
        {
          id: "institution-3",
          location: [-36.853, 174.766],
          label: "Auckland University of Technology",
        },
      ]
      render(<HeroGlobe markers={overlapping} />)
      fireEvent.pointerEnter(screen.getByTestId("marker-pulse-institution-3"))
      expect(screen.getByText("University of Auckland").style.getPropertyValue("opacity")).toBe(
        "var(--cobe-visible-institution-1, 0)",
      )
      expect(
        screen.getByText("Auckland University of Technology").style.getPropertyValue("opacity"),
      ).toBe("var(--cobe-visible-institution-3, 0)")
    })

    it("only shows the hovered marker's label", () => {
      render(<HeroGlobe markers={MARKERS} />)
      fireEvent.pointerEnter(screen.getByTestId(`marker-pulse-${MARKERS[0].id}`))
      expect(screen.getByText(MARKERS[1].label).style.getPropertyValue("opacity")).toBe("0")
    })

    it("doesn't let the labels block dragging", () => {
      render(<HeroGlobe markers={MARKERS} />)
      for (const { label } of MARKERS) {
        expect(screen.getByText(label)).toHaveClass("pointer-events-none")
      }
    })
  })

  describe("marker pulse", () => {
    it.each(MARKERS)("hides the $label pulse on the far side of the globe", ({ id }) => {
      render(<HeroGlobe markers={MARKERS} />)
      expect(screen.getByTestId(`marker-pulse-${id}`).style.getPropertyValue("opacity")).toBe(
        `var(--cobe-visible-${id}, 0)`,
      )
    })

    // Users who prefer reduced motion get a still halo instead.
    it("only animates when motion is allowed", () => {
      render(<HeroGlobe markers={MARKERS} />)
      for (const { id } of MARKERS) {
        expect(screen.getByTestId(`marker-pulse-${id}`).firstElementChild).toHaveClass(
          "motion-safe:animate-ping",
        )
      }
    })
  })

  it("renders the canvas with an accessible name", () => {
    render(<HeroGlobe markers={MARKERS} />)
    expect(screen.getByLabelText("Globe - drag to rotate").tagName).toBe("CANVAS")
  })

  describe("globe", () => {
    it("creates the globe on the canvas with a marker for each label", () => {
      render(<HeroGlobe markers={MARKERS} />)
      expect(createGlobe).toHaveBeenCalledOnce()
      const [canvas, options] = vi.mocked(createGlobe).mock.calls[0]
      expect(canvas).toBe(screen.getByLabelText("Globe - drag to rotate"))
      expect(options.markers).toEqual(
        MARKERS.map(({ id, location }) => expect.objectContaining({ id, location })),
      )
    })

    it("destroys the globe on unmount", () => {
      const { unmount } = render(<HeroGlobe markers={MARKERS} />)
      unmount()
      expect(destroy).toHaveBeenCalledOnce()
    })

    it("rotates the globe when dragged", () => {
      render(<HeroGlobe markers={MARKERS} />)
      const canvas = screen.getByLabelText("Globe - drag to rotate")
      fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 })
      fireEvent.pointerMove(canvas, { clientX: 50, clientY: 20 })
      expect(dragUpdates()).toEqual([{ phi: expect.any(Number), theta: expect.any(Number) }])
    })

    it("clamps the tilt so the globe can't flip over a pole", () => {
      render(<HeroGlobe markers={MARKERS} />)
      const canvas = screen.getByLabelText("Globe - drag to rotate")
      fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 })
      fireEvent.pointerMove(canvas, { clientX: 0, clientY: 10000 })
      fireEvent.pointerMove(canvas, { clientX: 0, clientY: -10000 })
      const [down, up] = dragUpdates()
      expect(down.theta).toBe(MAX_TILT)
      expect(up.theta).toBe(-MAX_TILT)
    })

    it("ignores pointer moves without a drag", () => {
      render(<HeroGlobe markers={MARKERS} />)
      const canvas = screen.getByLabelText("Globe - drag to rotate")
      fireEvent.pointerMove(canvas, { clientX: 50, clientY: 20 })
      fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 })
      fireEvent.pointerUp(canvas)
      fireEvent.pointerMove(canvas, { clientX: 50, clientY: 20 })
      expect(dragUpdates()).toEqual([])
    })
  })
})
