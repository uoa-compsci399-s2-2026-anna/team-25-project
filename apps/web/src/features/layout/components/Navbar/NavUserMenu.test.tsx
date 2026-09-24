import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import type { ComponentProps, ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Routes } from "@/lib/routes"
import { NavUserMenu } from "./NavUserMenu"

// Logging out is covered by LogoutButton's own tests - this only needs to
// know the button is in the menu.
vi.mock("@/features/auth/components/LogoutButton/LogoutButton", () => ({
  LogoutButton: ({ children }: { children: ReactNode }) => (
    <button type="button">{children}</button>
  ),
}))

const renderMenu = (props: Partial<ComponentProps<typeof NavUserMenu>> = {}) =>
  render(
    <NavUserMenu profileHref={Routes.MEMBERS.MEMBER(1)} {...props}>
      <span>Anna Tui</span>
    </NavUserMenu>,
  )

const openMenu = () => {
  fireEvent.click(screen.getByRole("button", { name: "Anna Tui" }))
}

describe("NavUserMenu", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders its children as the trigger", () => {
    renderMenu()
    expect(screen.getByRole("button", { name: "Anna Tui" })).toBeInTheDocument()
  })

  it("keeps the menu closed until the trigger is clicked", () => {
    renderMenu()
    expect(screen.queryByRole("button", { name: "Log out" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Profile" })).not.toBeInTheDocument()
  })

  it("opens a menu with a profile link and a log out button", () => {
    renderMenu()
    openMenu()
    expect(screen.getByRole("button", { name: "Profile" })).toHaveAttribute(
      "href",
      Routes.MEMBERS.MEMBER(1),
    )
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument()
  })

  it("closes the menu when the profile link is followed", async () => {
    renderMenu()
    openMenu()
    fireEvent.click(screen.getByRole("button", { name: "Profile" }))
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Log out" })).not.toBeInTheDocument()
    })
  })

  // An admin has no member directory entry, so NavAuthStatus sends no href.
  it("omits the profile link when there is no profile to point at", () => {
    renderMenu({ profileHref: undefined })
    openMenu()
    expect(screen.queryByRole("button", { name: "Profile" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument()
  })

  it("names the menu for screen readers, since the trigger is only a name and avatar", () => {
    renderMenu()
    openMenu()
    expect(screen.getByRole("dialog", { name: "Account" })).toBeInTheDocument()
  })

  it("closes the menu when escape is pressed", () => {
    renderMenu()
    openMenu()
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" })
    expect(screen.queryByRole("button", { name: "Log out" })).not.toBeInTheDocument()
  })
})
