import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Routes } from "@/lib/routes"
import { ProposalsPreviewPlaceholder } from "./ProposalsPreviewPlaceholder"

describe("ProposalsPreviewPlaceholder", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders the heading as an h3", () => {
    render(<ProposalsPreviewPlaceholder />)
    expect(
      screen.getByRole("heading", { level: 3, name: "Log in to see proposals available" }),
    ).toBeInTheDocument()
  })

  it("renders the description", () => {
    render(<ProposalsPreviewPlaceholder />)
    expect(
      screen.getByText(/Proposals are shared in confidence between CCCA members/),
    ).toBeInTheDocument()
  })

  it.each([
    ["27", "active proposals seeking collaborators"],
    ["6", "posted in the last 30 days"],
    ["8", "universities represented"],
  ])("renders the %s stat with its label", (value, label) => {
    render(<ProposalsPreviewPlaceholder />)
    expect(screen.getByText(value)).toBeInTheDocument()
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it("links Log in and Register with your uni email to the real routes", () => {
    render(<ProposalsPreviewPlaceholder />)
    expect(screen.getByRole("button", { name: "Log in" })).toHaveAttribute("href", Routes.LOGIN)
    expect(screen.getByRole("button", { name: "Register with your uni email" })).toHaveAttribute(
      "href",
      Routes.REGISTER.ROOT,
    )
  })
})
