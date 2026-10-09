import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { HeroSection } from "./HeroSection"

// Never resolves, so the globe stays on its skeleton - the globe itself is covered in
// InstitutionsGlobe.test.tsx.
vi.mock("../../globe.queries", () => ({
  getInstitutionMarkersCached: vi.fn(() => new Promise(() => {})),
}))

describe("HeroSection", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders the eyebrow text", () => {
    render(<HeroSection />)
    expect(screen.getByText("Computing Capstone Community Australasia")).toBeInTheDocument()
  })

  it("renders the heading as an h1", () => {
    render(<HeroSection />)
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Join the Computing Capstone Community Australasia",
      }),
    ).toBeInTheDocument()
  })

  it("renders the description", () => {
    render(<HeroSection />)
    expect(
      screen.getByText(
        /Academics across Australian and New Zealand universities post research ideas/,
      ),
    ).toBeInTheDocument()
  })

  it("shows the globe's skeleton while its markers load", () => {
    const { container } = render(<HeroSection />)
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument()
  })

  // Registering is asked for in Who can join now, so the hero makes no second ask.
  it("renders no call to action", () => {
    render(<HeroSection />)
    expect(screen.queryAllByRole("button")).toHaveLength(0)
  })
})
