import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Routes } from "@/lib/routes"
import { Footer } from "./Footer"

describe("Footer", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders a footer landmark", () => {
    render(<Footer />)
    expect(screen.getByRole("contentinfo")).toBeInTheDocument()
  })

  it("renders the brand heading as an h3", () => {
    render(<Footer />)
    expect(screen.getByRole("heading", { level: 3, name: "CCCA" })).toBeInTheDocument()
  })

  it("renders the brand description", () => {
    render(<Footer />)
    expect(screen.getByText(/Computing Capstone Community Australasia\./)).toBeInTheDocument()
    expect(screen.getByText(/A community of practice, not a publisher\./)).toBeInTheDocument()
  })

  it("renders each link category as an uppercase h6", () => {
    render(<Footer />)
    for (const category of ["Explore", "Community", "Contact"]) {
      const heading = screen.getByRole("heading", { level: 6, name: category })
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveClass("uppercase")
    }
  })

  it.each([
    ["Members", Routes.MEMBERS.ROOT],
    ["Courses", Routes.COURSES.ROOT],
    ["Proposals", Routes.PROPOSALS.ROOT],
    ["About", Routes.ABOUT],
    ["Privacy", Routes.PRIVACY],
  ])("links %s to %s", (name, href) => {
    render(<Footer />)
    expect(screen.getByRole("link", { name })).toHaveAttribute("href", href)
  })

  it("renders every link inside a list item", () => {
    render(<Footer />)
    const links = screen.getAllByRole("link")
    expect(links).toHaveLength(5)
    for (const link of links) {
      expect(link.closest("li")).not.toBeNull()
    }
  })

  it("groups the Explore links under the Explore heading", () => {
    render(<Footer />)
    const group = screen.getByRole("heading", { level: 6, name: "Explore" })
      .parentElement as HTMLElement
    const names = within(group)
      .getAllByRole("link")
      .map((link) => link.textContent)
    expect(names).toEqual(["Members", "Courses", "Proposals"])
  })
})
