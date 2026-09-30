import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { SiteLink } from "@/features/layout/links"
import { Footer } from "./Footer"

// FooterLinkList is async, so stub it here to a sync list of every link it
// was given. FooterLinkList.test.tsx covers hiding members-only links.
vi.mock("./FooterLinkList", () => ({
  FooterLinkList: ({ links }: { links: readonly SiteLink[] }) => (
    <ul data-testid="footer-link-list">
      {links.map((link) => (
        <li key={link.name}>{link.name}</li>
      ))}
    </ul>
  ),
}))

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
    ["Explore", ["Members", "Courses", "Proposals"]],
    ["Community", ["About", "Resources", "News"]],
    ["Contact", ["Privacy"]],
  ])("passes the %s links to FooterLinkList under their heading", (category, names) => {
    render(<Footer />)
    const group = screen.getByRole("heading", { level: 6, name: category })
      .parentElement as HTMLElement
    // Going through FooterLinkList is what hides the members-only links from
    // guests, so a group that rendered its links itself would leak them.
    expect(
      within(within(group).getByTestId("footer-link-list"))
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(names)
  })

  it("renders the groups inside the footer navigation landmark", () => {
    render(<Footer />)
    expect(screen.getByRole("navigation", { name: "Footer" })).toContainElement(
      screen.getByRole("heading", { level: 6, name: "Explore" }),
    )
  })
})
