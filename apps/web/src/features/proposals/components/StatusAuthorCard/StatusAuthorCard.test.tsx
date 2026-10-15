import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Routes } from "@/lib/routes"
import { StatusAuthorCard } from "./StatusAuthorCard"

describe("StatusAuthorCard", () => {
  afterEach(() => {
    cleanup()
  })

  it("selects the Active tab when the proposal is active", () => {
    render(<StatusAuthorCard status="active" updatedAt="2026-08-05T00:00:00.000Z" />)
    expect(screen.getByRole("tab", { name: "Active" })).toHaveAttribute("data-active")
  })

  it("selects the Closed tab when the proposal is closed", () => {
    render(<StatusAuthorCard status="closed" updatedAt="2026-08-05T00:00:00.000Z" />)
    expect(screen.getByRole("tab", { name: "Closed" })).toHaveAttribute("data-active")
  })

  it("renders the Edit proposal link", () => {
    render(<StatusAuthorCard status="active" updatedAt="2026-08-05T00:00:00.000Z" />)
    expect(screen.getByRole("button", { name: "Edit proposal" })).toHaveAttribute(
      "href",
      Routes.HOME,
    )
  })

  it("renders the formatted last-edited date", () => {
    render(<StatusAuthorCard status="active" updatedAt="2026-08-05T00:00:00.000Z" />)
    expect(screen.getByText("Last edited 5 Aug 2026")).toBeInTheDocument()
  })
})
