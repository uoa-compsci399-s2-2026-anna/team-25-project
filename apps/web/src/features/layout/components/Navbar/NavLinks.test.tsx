import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Routes } from "@/lib/routes"
import { NavLinks } from "./NavLinks"

vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))

const signOut = () => {
  vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })
}

const signInAs = (collection: "admin" | "members") => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    collection,
    // biome-ignore lint/suspicious/noExplicitAny: NavLinks only checks a user exists
    user: { id: 1 } as any,
  })
}

const renderNavLinks = async () => render(await NavLinks())

const publicLinks = [
  ["About", Routes.ABOUT],
  ["Members", Routes.MEMBERS.ROOT],
  ["Resources", Routes.RESOURCES],
  ["News", Routes.NEWS],
] as const

const memberLinks = [
  ["Courses", Routes.COURSES.ROOT],
  ["Proposals", Routes.PROPOSALS.ROOT],
] as const

describe("NavLinks", () => {
  afterEach(() => {
    cleanup()
  })

  describe("signed out", () => {
    it.each(publicLinks)("links %s to %s", async (name, href) => {
      signOut()
      await renderNavLinks()
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href)
    })

    it.each(memberLinks)("hides %s", async (name) => {
      signOut()
      await renderNavLinks()
      expect(screen.queryByRole("link", { name })).not.toBeInTheDocument()
    })
  })

  describe.each(["members", "admin"] as const)("signed in as %s", (collection) => {
    it.each([...publicLinks, ...memberLinks])("links %s to %s", async (name, href) => {
      signInAs(collection)
      await renderNavLinks()
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href)
    })
  })

  it("keeps the member links in their place among the public ones", async () => {
    signInAs("members")
    await renderNavLinks()
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "About",
      "Members",
      "Courses",
      "Proposals",
      "Resources",
      "News",
    ])
  })
})
