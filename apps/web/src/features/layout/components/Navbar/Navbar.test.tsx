import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Routes } from "@/lib/routes"
import { Navbar } from "./Navbar"

// NavAuthStatus is async - it can only really run inside Next.js's RSC
// pipeline, not a plain client-side render(), so it's covered on its own in
// NavAuthStatus.test.tsx. Stub it here to a plain sync component so Suspense
// has nothing to actually suspend on.
vi.mock("./NavAuthStatus", () => ({
  NavAuthStatus: () => <div data-testid="nav-auth-status" />,
}))

describe("Navbar", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders a banner landmark", () => {
    render(<Navbar />)
    expect(screen.getByRole("banner")).toBeInTheDocument()
  })

  it("renders the brand link to home", () => {
    render(<Navbar />)
    expect(screen.getByRole("link", { name: "CCCA" })).toHaveAttribute("href", Routes.HOME)
  })

  it.each([
    ["About", Routes.ABOUT],
    ["Members", Routes.MEMBERS.ROOT],
    ["Courses", Routes.COURSES.ROOT],
    ["Proposals", Routes.PROPOSALS.ROOT],
    ["Resources", Routes.RESOURCES],
    ["News", Routes.NEWS],
  ])("links %s to %s", (name, href) => {
    render(<Navbar />)
    expect(screen.getByRole("link", { name })).toHaveAttribute("href", href)
  })

  it("renders every nav item inside the main navigation landmark", () => {
    render(<Navbar />)
    const nav = screen.getByRole("navigation", { name: "Main" })
    for (const name of ["About", "Members", "Courses", "Proposals", "Resources", "News"]) {
      expect(nav).toContainElement(screen.getByRole("link", { name }))
    }
  })

  it("renders NavAuthStatus", () => {
    render(<Navbar />)
    expect(screen.getByTestId("nav-auth-status")).toBeInTheDocument()
  })
})
