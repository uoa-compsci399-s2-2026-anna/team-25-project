import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Routes } from "@/lib/routes"
import { NavAuthStatus } from "./NavAuthStatus"

vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))

const signOut = () => {
  vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })
}

const signInAsMember = (
  overrides: { avatar?: { url: string } | null; firstName?: string; lastName?: string } = {},
) => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    collection: "members",
    user: {
      id: 1,
      firstName: overrides.firstName ?? "Anna",
      lastName: overrides.lastName ?? "Tui",
      avatar: overrides.avatar,
      // biome-ignore lint/suspicious/noExplicitAny: minimal Member mock, only the fields NavAuthStatus reads are relevant
    } as any,
  })
}

const signInAsAdmin = () => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    collection: "admin",
    user: {
      id: 1,
      firstName: "Ada",
      lastName: "Lovelace",
      // biome-ignore lint/suspicious/noExplicitAny: minimal Admin mock, only the fields NavAuthStatus reads are relevant
    } as any,
  })
}

const renderNavAuthStatus = async () => render(await NavAuthStatus())

describe("NavAuthStatus", () => {
  afterEach(() => {
    cleanup()
  })

  describe("signed out", () => {
    it("renders Log in and Join CCCA as links", async () => {
      signOut()
      await renderNavAuthStatus()
      expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", Routes.LOGIN)
      expect(screen.getByRole("link", { name: "Join CCCA" })).toHaveAttribute(
        "href",
        Routes.REGISTER.ROOT,
      )
    })

    it("does not render a signed-in name", async () => {
      signOut()
      await renderNavAuthStatus()
      expect(screen.queryByText("Anna Tui")).not.toBeInTheDocument()
    })
  })

  describe("signed in", () => {
    it("renders the member's full name instead of Log in / Join CCCA", async () => {
      signInAsMember()
      await renderNavAuthStatus()
      expect(screen.getByText("Anna Tui")).toBeInTheDocument()
      expect(screen.queryByRole("link", { name: "Log in" })).not.toBeInTheDocument()
      expect(screen.queryByRole("link", { name: "Join CCCA" })).not.toBeInTheDocument()
    })

    it("still renders the fallback initials when the member has an avatar", async () => {
      // jsdom never resolves an <img> load, so Base UI's Avatar.Image never
      // reaches "loaded" and the fallback stays in the DOM either way - this
      // only proves the avatar branch doesn't crash or drop the fallback,
      // not that the image itself renders. See packages/ui's own avatar.test.tsx.
      signInAsMember({ avatar: { url: "https://example.com/anna.jpg" } })
      await renderNavAuthStatus()
      expect(screen.getByText("AT")).toBeInTheDocument()
    })

    it("falls back to initials when the member has no avatar", async () => {
      signInAsMember({ avatar: null })
      await renderNavAuthStatus()
      expect(screen.getByText("AT")).toBeInTheDocument()
    })

    it("renders the admin's full name and initials", async () => {
      signInAsAdmin()
      await renderNavAuthStatus()
      expect(screen.getByText("Ada Lovelace")).toBeInTheDocument()
      expect(screen.getByText("AL")).toBeInTheDocument()
    })

    it("falls back to an empty initial rather than throwing on a blank name", async () => {
      signInAsMember({ firstName: "", lastName: "" })
      await renderNavAuthStatus()
      const fallback = screen.getByText("", { selector: "[data-slot=avatar-fallback]" })
      expect(fallback).toBeInTheDocument()
    })

    it("caps and truncates a long name instead of letting it grow unbounded", async () => {
      // Navbar centers the middle nav links by giving the logo and this
      // section equal flex-1 shares - that only holds if neither side's
      // content can grow past roughly half the header, so a long name has
      // to be capped rather than rendered at its natural width.
      signInAsMember({ firstName: "Christopher", lastName: "Featherstonehaugh" })
      await renderNavAuthStatus()
      const name = screen.getByText("Christopher Featherstonehaugh")
      expect(name).toHaveClass("max-w-32", "truncate")
    })
  })
})
