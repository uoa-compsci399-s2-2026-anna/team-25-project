import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Routes } from "@/lib/routes"
import { Navbar } from "./Navbar"

// NavAuthStatus and NavLinks are async - they can only really run inside
// Next.js's RSC pipeline, not a plain client-side render(), so they're covered
// on their own in NavAuthStatus.test.tsx and NavLinks.test.tsx. Stub them here
// to plain sync components so Suspense has nothing to actually suspend on.
vi.mock("./NavAuthStatus", () => ({
  NavAuthStatus: () => <div data-testid="nav-auth-status" />,
}))
vi.mock("./NavLinks", () => ({
  NavLinks: () => <div data-testid="nav-links" />,
  GuestNavLinks: () => null,
}))
vi.mock("./MobileNav", () => ({
  MobileNav: () => <div data-testid="mobile-nav" />,
  GuestMobileNav: () => null,
}))
vi.mock("../AdminBanner/AdminBanner", () => ({
  AdminBanner: () => <div data-testid="admin-banner" />,
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

  it("renders NavLinks inside the main navigation landmark", () => {
    render(<Navbar />)
    expect(screen.getByRole("navigation", { name: "Main" })).toContainElement(
      screen.getByTestId("nav-links"),
    )
  })

  it("renders NavAuthStatus", () => {
    render(<Navbar />)
    expect(screen.getByTestId("nav-auth-status")).toBeInTheDocument()
  })

  it("renders MobileNav", () => {
    render(<Navbar />)
    expect(screen.getByTestId("mobile-nav")).toBeInTheDocument()
  })

  it("renders AdminBanner inside the sticky header, so it stays in view", () => {
    render(<Navbar />)
    expect(screen.getByRole("banner")).toHaveClass("sticky")
    expect(screen.getByRole("banner")).toContainElement(screen.getByTestId("admin-banner"))
  })

  it("hides the desktop links and account below md, and MobileNav from md up", () => {
    render(<Navbar />)
    expect(screen.getByRole("navigation", { name: "Main" })).toHaveClass("hidden", "md:flex")
    expect(screen.getByTestId("nav-auth-status").parentElement).toHaveClass("hidden", "md:flex")
    expect(screen.getByTestId("mobile-nav").parentElement).toHaveClass("md:hidden")
  })
})
