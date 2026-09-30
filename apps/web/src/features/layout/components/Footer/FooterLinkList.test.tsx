import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { type SiteLink, siteLinks } from "@/features/layout/links"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Routes } from "@/lib/routes"
import { FooterLinkList } from "./FooterLinkList"

vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))

const signOut = () => {
  vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })
}

const signInAs = (collection: "admin" | "members") => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    collection,
    // biome-ignore lint/suspicious/noExplicitAny: FooterLinkList only checks a user exists
    user: { id: 1 } as any,
  })
}

const links = [siteLinks.members, siteLinks.courses, siteLinks.proposals]

const renderFooterLinkList = async (list: readonly SiteLink[] = links) =>
  render(await FooterLinkList({ links: list }))

describe("FooterLinkList", () => {
  afterEach(() => {
    cleanup()
  })

  describe("signed out", () => {
    it("links the public pages", async () => {
      signOut()
      await renderFooterLinkList()
      expect(screen.getByRole("link", { name: "Members" })).toHaveAttribute(
        "href",
        Routes.MEMBERS.ROOT,
      )
    })

    it("links Privacy to its page", async () => {
      signOut()
      await renderFooterLinkList([siteLinks.privacy])
      expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", Routes.PRIVACY)
    })

    it("renders only the public links", async () => {
      signOut()
      await renderFooterLinkList()
      expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Members"])
    })

    it.each(["Courses", "Proposals"])("hides %s", async (name) => {
      signOut()
      await renderFooterLinkList()
      expect(screen.queryByRole("link", { name })).not.toBeInTheDocument()
    })
  })

  describe.each(["members", "admin"] as const)("signed in as %s", (collection) => {
    it.each([
      ["Members", Routes.MEMBERS.ROOT],
      ["Courses", Routes.COURSES.ROOT],
      ["Proposals", Routes.PROPOSALS.ROOT],
    ])("links %s to %s", async (name, href) => {
      signInAs(collection)
      await renderFooterLinkList()
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href)
    })
  })

  it("renders every link inside a list item, in order", async () => {
    signInAs("members")
    await renderFooterLinkList()
    const items = screen.getAllByRole("listitem")
    expect(items.map((item) => item.textContent)).toEqual(["Members", "Courses", "Proposals"])
    for (const item of items) {
      expect(item.querySelector("a")).not.toBeNull()
    }
  })
})
