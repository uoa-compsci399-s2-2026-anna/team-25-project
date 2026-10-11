import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getInstitutionMarkersCached } from "../../globe.queries"
import { HeroGlobeSkeleton, InstitutionsGlobe } from "./InstitutionsGlobe"

vi.mock("../../globe.queries", () => ({ getInstitutionMarkersCached: vi.fn() }))

// cobe needs WebGL, which jsdom doesn't have, so stand in a fake globe.
vi.mock("cobe", () => ({ default: vi.fn(() => ({ update: vi.fn(), destroy: vi.fn() })) }))

describe("InstitutionsGlobe", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders the globe with a marker for each institution", async () => {
    vi.mocked(getInstitutionMarkersCached).mockResolvedValue([
      { id: "institution-1", location: [-36.8523, 174.769], label: "University of Auckland" },
    ])

    render(await InstitutionsGlobe())
    expect(screen.getByLabelText("Globe - drag to rotate")).toBeInTheDocument()
    expect(screen.getByText("University of Auckland")).toBeInTheDocument()
  })
})

describe("HeroGlobeSkeleton", () => {
  it("renders a placeholder", () => {
    const { container } = render(<HeroGlobeSkeleton />)
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument()
    cleanup()
  })
})
