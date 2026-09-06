import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Routes } from "@/lib/routes"
import { Navbar } from "./Navbar"

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
    ["Resources", Routes.HOME],
    ["News", Routes.HOME],
  ])("links %s to %s", (name, href) => {
    render(<Navbar />)
    expect(screen.getByRole("link", { name })).toHaveAttribute("href", href)
  })

  it("renders Log in and Join CCCA as links", () => {
    render(<Navbar />)
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", Routes.HOME)
    expect(screen.getByRole("link", { name: "Join CCCA" })).toHaveAttribute("href", Routes.HOME)
  })

  it("renders every nav item inside the main navigation landmark", () => {
    render(<Navbar />)
    const nav = screen.getByRole("navigation", { name: "Main" })
    for (const name of ["About", "Members", "Courses", "Proposals", "Resources", "News"]) {
      expect(nav).toContainElement(screen.getByRole("link", { name }))
    }
  })
})

describe("Routes", () => {
  it("builds a course route from an id", () => {
    expect(Routes.COURSES.COURSE("123")).toBe("/courses/123")
  })

  it("builds a member route from an id", () => {
    expect(Routes.MEMBERS.MEMBER("456")).toBe("/members/456")
  })

  it("builds a proposal route from an id", () => {
    expect(Routes.PROPOSALS.PROPOSAL("789")).toBe("/proposals/789")
  })
})
