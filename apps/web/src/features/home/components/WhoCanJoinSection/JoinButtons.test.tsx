import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Routes } from "@/lib/routes"
import { JoinButtons } from "./JoinButtons"

vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))

const signOut = () => {
  vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })
}

const signInAsMember = () => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    collection: "members",
    // biome-ignore lint/suspicious/noExplicitAny: JoinButtons only checks that a user exists
    user: { id: 1 } as any,
  })
}

const renderJoinButtons = async () => render(await JoinButtons())

describe("JoinButtons", () => {
  afterEach(() => {
    cleanup()
  })

  describe("when signed out", () => {
    it("links the register button to the register flow", async () => {
      signOut()
      await renderJoinButtons()
      expect(screen.getByRole("button", { name: "Register with your uni email" })).toHaveAttribute(
        "href",
        Routes.REGISTER.ROOT,
      )
    })

    // The navbar is otherwise the only way in from this page.
    it("links Log in to the login flow", async () => {
      signOut()
      await renderJoinButtons()
      expect(screen.getByRole("button", { name: "Log in" })).toHaveAttribute("href", Routes.LOGIN)
    })
  })

  describe("when signed in", () => {
    it("links to the members page instead of register and log in", async () => {
      signInAsMember()
      await renderJoinButtons()
      expect(screen.getByRole("button", { name: "View Members" })).toHaveAttribute(
        "href",
        Routes.MEMBERS.ROOT,
      )
      expect(screen.queryByRole("button", { name: "Register with your uni email" })).toBeNull()
      expect(screen.queryByRole("button", { name: "Log in" })).toBeNull()
    })
  })
})
