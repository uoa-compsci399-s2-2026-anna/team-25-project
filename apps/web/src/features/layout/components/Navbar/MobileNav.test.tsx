import { cleanup, render } from "@testing-library/react"
import type { ComponentProps } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Routes } from "@/lib/routes"
import { MobileNav } from "./MobileNav"
import type { MobileNavMenu } from "./MobileNavMenu"

vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))

// Only the props MobileNav builds - the menu itself is tested in MobileNavMenu.test.tsx.
const menu = vi.hoisted(() => vi.fn((_props: object) => null))
vi.mock("./MobileNavMenu", () => ({ MobileNavMenu: menu }))

type MenuProps = ComponentProps<typeof MobileNavMenu>

const renderMobileNav = async () => {
  render(await MobileNav())
  return menu.mock.lastCall?.[0] as MenuProps
}

const signOut = () => {
  vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })
}

const signInAsMember = (overrides: Record<string, unknown> = {}) => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    collection: "members",
    user: {
      id: 7,
      firstName: "Anna",
      lastName: "Tui",
      position: "Senior Lecturer",
      institution: { id: 1, name: "University of Example" },
      avatar: null,
      ...overrides,
    } as never,
  })
}

const signInAsAdmin = () => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    collection: "admin",
    // biome-ignore lint/suspicious/noExplicitAny: only the fields MobileNav reads
    user: { id: 2, firstName: "Ada", lastName: "Admin" } as any,
  })
}

const linkNames = (props: MenuProps) => props.links.map((link) => link.name)

describe("MobileNav", () => {
  afterEach(() => {
    cleanup()
    menu.mockClear()
  })

  describe("guest", () => {
    it("only offers the public pages", async () => {
      signOut()
      expect(linkNames(await renderMobileNav())).toEqual(["Home", "Members", "Publications"])
    })

    it("passes no account", async () => {
      signOut()
      expect((await renderMobileNav()).account).toBeUndefined()
    })
  })

  describe("member", () => {
    it("offers every page, in the desktop navbar's order", async () => {
      signInAsMember()
      expect(linkNames(await renderMobileNav())).toEqual([
        "Home",
        "Members",
        "Courses",
        "Proposals",
        "Publications",
        "Resources",
      ])
    })

    it("points the account button at their profile, labelled My Profile", async () => {
      signInAsMember()
      expect((await renderMobileNav()).account).toMatchObject({
        href: Routes.MEMBERS.MEMBER(7),
        hrefLabel: "My Profile",
        initials: "AT",
        name: "Anna Tui",
      })
    })

    it("shows their institution under their name", async () => {
      signInAsMember()
      expect((await renderMobileNav()).account?.subtitle).toBe("University of Example")
    })

    it("falls back to their position when the institution isn't populated", async () => {
      signInAsMember({ institution: 1 })
      expect((await renderMobileNav()).account?.subtitle).toBe("Senior Lecturer")
    })

    it("passes their avatar when they have one", async () => {
      signInAsMember({ avatar: { url: "/media/anna.png" } })
      expect((await renderMobileNav()).account?.avatarUrl).toBe("/media/anna.png")
    })

    it("passes no avatar when they have none", async () => {
      signInAsMember()
      expect((await renderMobileNav()).account?.avatarUrl).toBeUndefined()
    })
  })

  describe("admin", () => {
    it("points the account button at the admin dashboard", async () => {
      signInAsAdmin()
      expect((await renderMobileNav()).account).toMatchObject({
        href: Routes.ADMIN,
        hrefLabel: "Admin dashboard",
        name: "Ada Admin",
        subtitle: "Administrator",
      })
    })
  })
})
