import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getInstitutionsWithLogosCached } from "@/features/institutions/institutions.queries"
import Page from "./page"

vi.mock("@/features/institutions/institutions.queries", () => ({
  getInstitutionsWithLogosCached: vi.fn(),
}))

vi.mock("@/features/home/globe.queries", () => ({
  getInstitutionMarkersCached: vi.fn().mockResolvedValue([]),
}))

describe("Home page", () => {
  // Some tests below override this to a never-resolving promise to inspect the
  // Suspense fallback - reset it before every test so that doesn't leak across cases.
  beforeEach(() => {
    vi.mocked(getInstitutionsWithLogosCached).mockReset().mockResolvedValue([])
  })

  afterEach(() => {
    cleanup()
  })

  it("renders HeroSection", async () => {
    render(await Page())
    expect(screen.getByText("Computing Capstone Community Australasia")).toBeInTheDocument()
  })

  it("renders the institutions ticker's skeleton while logos load", async () => {
    vi.mocked(getInstitutionsWithLogosCached).mockReturnValue(new Promise(() => {}))
    const { container } = render(await Page())
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(8)
  })

  it("renders AboutSection", async () => {
    render(await Page())
    expect(screen.getByRole("heading", { level: 2, name: "About us" })).toBeInTheDocument()
  })

  it("renders BenefitsSection", async () => {
    render(await Page())
    expect(
      screen.getByRole("heading", { level: 2, name: "Benefits of being a member" }),
    ).toBeInTheDocument()
  })

  it("renders WhoCanJoinSection", async () => {
    render(await Page())
    expect(screen.getByRole("heading", { level: 2, name: "Who can join" })).toBeInTheDocument()
  })

  // The order the design lays them out in.
  it("renders the sections in order", async () => {
    render(await Page())
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual([
      "About us",
      "Benefits of being a member",
      "Who can join",
    ])
  })
})
