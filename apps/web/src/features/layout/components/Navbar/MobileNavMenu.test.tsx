import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { usePathname, useSearchParams } from "next/navigation"
import type { ComponentProps, ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { Routes } from "@/lib/routes"
import { type MobileNavAccount, MobileNavMenu } from "./MobileNavMenu"

vi.mock("next/navigation", () => ({ usePathname: vi.fn(), useSearchParams: vi.fn() }))

// LogoutButton has its own tests.
vi.mock("@/features/auth/components/LogoutButton/LogoutButton", () => ({
  LogoutButton: ({ children }: { children: ReactNode }) => (
    <button type="button">{children}</button>
  ),
}))

const visit = (pathname: string, search = "") => {
  vi.mocked(usePathname).mockReturnValue(pathname)
  // biome-ignore lint/suspicious/noExplicitAny: URLSearchParams stands in for ReadonlyURLSearchParams
  vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams(search) as any)
}

// jsdom has no matchMedia.
let resizeViewport: (desktop: boolean) => void
const breakpointListeners = new Set<() => void>()
const stubMatchMedia = () => {
  breakpointListeners.clear()
  vi.stubGlobal("matchMedia", (query: string) => {
    const listeners = breakpointListeners
    const media = {
      matches: false,
      media: query,
      addEventListener: (_: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
    }
    resizeViewport = (desktop) => {
      media.matches = desktop
      for (const listener of listeners) listener()
    }
    return media
  })
}

const links = [
  { name: "Home", href: Routes.HOME },
  { name: "Members", href: Routes.MEMBERS.ROOT },
  { name: "Proposals", href: Routes.PROPOSALS.ROOT },
]

const member: MobileNavAccount = {
  name: "Anna Tui",
  initials: "AT",
  subtitle: "University of Example",
  href: Routes.MEMBERS.MEMBER(1),
  hrefLabel: "My Profile",
}

const renderMenu = (props: Partial<ComponentProps<typeof MobileNavMenu>> = {}) =>
  render(<MobileNavMenu links={links} {...props} />)

const toggle = () => screen.getByRole("button", { name: /menu/ })
const panel = () => document.getElementById(toggle().getAttribute("aria-controls") ?? "")
const openMenu = () => fireEvent.click(screen.getByRole("button", { name: "Open menu" }))

describe("MobileNavMenu", () => {
  beforeEach(() => {
    visit("/")
    stubMatchMedia()
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    document.body.style.overflow = ""
  })

  describe("toggle", () => {
    it("starts closed, with the sheet inert", () => {
      renderMenu()
      expect(toggle()).toHaveAttribute("aria-expanded", "false")
      expect(toggle()).toHaveAccessibleName("Open menu")
      expect(panel()).toHaveAttribute("inert")
      expect(panel()).toHaveAttribute("data-state", "closed")
    })

    it("controls the sheet it opens", () => {
      renderMenu()
      expect(panel()).not.toBeNull()
    })

    it("opens the sheet and relabels itself to close it", () => {
      renderMenu()
      openMenu()
      expect(toggle()).toHaveAttribute("aria-expanded", "true")
      expect(toggle()).toHaveAccessibleName("Close menu")
      expect(panel()).not.toHaveAttribute("inert")
      expect(panel()).toHaveAttribute("data-state", "open")
    })

    it("morphs its icon between a hamburger and an X", () => {
      renderMenu()
      const icon = toggle().querySelector("[data-slot=menu-toggle-icon]")
      expect(icon).toHaveAttribute("data-state", "closed")
      openMenu()
      expect(icon).toHaveAttribute("data-state", "open")
    })

    it("closes the sheet when clicked again", () => {
      renderMenu()
      openMenu()
      fireEvent.click(screen.getByRole("button", { name: "Close menu" }))
      expect(panel()).toHaveAttribute("inert")
    })
  })

  describe("closing", () => {
    it("closes on escape and hands focus back to the toggle", () => {
      renderMenu()
      openMenu()
      fireEvent.keyDown(document, { key: "Escape" })
      expect(panel()).toHaveAttribute("inert")
      expect(toggle()).toHaveFocus()
    })

    it("ignores other keys", () => {
      renderMenu()
      openMenu()
      fireEvent.keyDown(document, { key: "Enter" })
      expect(panel()).not.toHaveAttribute("inert")
    })

    it("closes when a link is followed", () => {
      renderMenu()
      openMenu()
      fireEvent.click(screen.getByRole("link", { name: "Members" }))
      expect(panel()).toHaveAttribute("inert")
    })

    it("closes when the page changes underneath it", () => {
      const { rerender } = renderMenu()
      openMenu()
      visit(Routes.MEMBERS.ROOT)
      rerender(<MobileNavMenu links={links} />)
      expect(panel()).toHaveAttribute("inert")
    })

    it("closes when the viewport widens past the desktop breakpoint", () => {
      renderMenu()
      openMenu()
      act(() => resizeViewport(true))
      expect(panel()).toHaveAttribute("inert")
    })

    it("stays open when the viewport changes but is still below the breakpoint", () => {
      renderMenu()
      openMenu()
      act(() => resizeViewport(false))
      expect(panel()).not.toHaveAttribute("inert")
    })

    it("stops listening for escape and resizes once closed", () => {
      const removeListener = vi.spyOn(document, "removeEventListener")
      renderMenu()
      openMenu()
      expect(breakpointListeners.size).toBe(1)
      fireEvent.click(screen.getByRole("button", { name: "Close menu" }))
      expect(breakpointListeners.size).toBe(0)
      expect(removeListener).toHaveBeenCalledWith("keydown", expect.any(Function))
    })
  })

  describe("scroll lock", () => {
    it("locks page scroll while open", () => {
      renderMenu()
      openMenu()
      expect(document.body.style.overflow).toBe("hidden")
    })

    it("restores page scroll once closed", () => {
      document.body.style.overflow = "auto"
      renderMenu()
      openMenu()
      fireEvent.click(screen.getByRole("button", { name: "Close menu" }))
      expect(document.body.style.overflow).toBe("auto")
    })
  })

  describe("page behind", () => {
    const renderInPage = () =>
      render(
        <>
          <header>
            <MobileNavMenu links={links} />
          </header>
          <main data-testid="page" />
          <aside data-testid="already-inert" inert />
          <footer data-testid="footer" />
          <div data-testid="portal" />
        </>,
      )

    it("makes the page behind inert while open, so tab stays in the sheet", () => {
      renderInPage()
      expect(screen.getByTestId("page")).not.toHaveAttribute("inert")
      openMenu()
      expect(screen.getByTestId("page")).toHaveAttribute("inert")
      expect(screen.getByTestId("footer")).toHaveAttribute("inert")
    })

    // Portals (toasts) and Next's route announcer render after the footer.
    it("leaves anything after the footer reachable", () => {
      renderInPage()
      openMenu()
      expect(screen.getByTestId("portal")).not.toHaveAttribute("inert")
    })

    it("restores the page behind once closed", () => {
      renderInPage()
      openMenu()
      fireEvent.click(screen.getByRole("button", { name: "Close menu" }))
      expect(screen.getByTestId("page")).not.toHaveAttribute("inert")
      expect(screen.getByTestId("footer")).not.toHaveAttribute("inert")
    })

    it("leaves anything that was already inert alone", () => {
      renderInPage()
      openMenu()
      fireEvent.click(screen.getByRole("button", { name: "Close menu" }))
      expect(screen.getByTestId("already-inert")).toHaveAttribute("inert")
    })

    it("keeps the header itself reachable", () => {
      renderInPage()
      openMenu()
      expect(screen.getByRole("banner")).not.toHaveAttribute("inert")
    })
  })

  describe("links", () => {
    it("lists every link it is given, in order, inside the mobile navigation", () => {
      renderMenu()
      const nav = screen.getByRole("navigation", { name: "Mobile" })
      expect(
        within(nav)
          .getAllByRole("link")
          .map((link) => link.textContent),
      ).toEqual(["Home", "Members", "Proposals"])
      expect(within(nav).getByRole("link", { name: "Proposals" })).toHaveAttribute(
        "href",
        Routes.PROPOSALS.ROOT,
      )
    })

    it("marks the current page's link", () => {
      visit(Routes.MEMBERS.ROOT)
      renderMenu()
      expect(screen.getByRole("link", { name: "Members" })).toHaveAttribute("aria-current", "page")
      expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current")
    })

    // Every path starts with "/", so Home must only match exactly.
    it("doesn't mark Home on another page", () => {
      visit(Routes.MEMBERS.MEMBER(4))
      renderMenu()
      expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current")
      expect(screen.getByRole("link", { name: "Members" })).toHaveAttribute("aria-current", "page")
    })

    it("only matches whole path segments", () => {
      visit("/members-area")
      renderMenu()
      expect(screen.getByRole("link", { name: "Members" })).not.toHaveAttribute("aria-current")
    })
  })

  describe("signed in", () => {
    it("shows the account's name and subtitle", () => {
      renderMenu({ account: member })
      expect(screen.getByText("Anna Tui")).toBeInTheDocument()
      expect(screen.getByText("University of Example")).toBeInTheDocument()
    })

    it("shows the account's initials while there is no avatar", () => {
      renderMenu({ account: member })
      expect(screen.getByText("AT")).toBeInTheDocument()
    })

    it("links to the account's page under its label", () => {
      renderMenu({ account: member })
      expect(screen.getByRole("button", { name: "My Profile" })).toHaveAttribute(
        "href",
        Routes.MEMBERS.MEMBER(1),
      )
    })

    it("closes when the account link is followed", () => {
      renderMenu({ account: member })
      openMenu()
      fireEvent.click(screen.getByRole("button", { name: "My Profile" }))
      expect(panel()).toHaveAttribute("inert")
    })

    it("offers a log out button", () => {
      renderMenu({ account: member })
      expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument()
    })

    it("doesn't offer guest actions", () => {
      renderMenu({ account: member })
      expect(screen.queryByRole("link", { name: "Log in" })).not.toBeInTheDocument()
      expect(screen.queryByRole("link", { name: "Join CCCA" })).not.toBeInTheDocument()
    })
  })

  describe("guest", () => {
    it("shows no account details or log out", () => {
      renderMenu()
      expect(screen.queryByRole("button", { name: "Log out" })).not.toBeInTheDocument()
      expect(screen.queryByRole("button", { name: "My Profile" })).not.toBeInTheDocument()
    })

    it("offers log in and join, sending the user back to this page afterwards", () => {
      visit(Routes.MEMBERS.ROOT, "q=tui")
      renderMenu()
      expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
        "href",
        `${Routes.LOGIN}?redirect=${encodeURIComponent("/members?q=tui")}`,
      )
      expect(screen.getByRole("link", { name: "Join CCCA" })).toHaveAttribute(
        "href",
        `${Routes.REGISTER.ROOT}?redirect=${encodeURIComponent("/members?q=tui")}`,
      )
    })

    it("closes when log in is followed", () => {
      renderMenu()
      openMenu()
      fireEvent.click(screen.getByRole("link", { name: "Log in" }))
      expect(panel()).toHaveAttribute("inert")
    })
  })
})
