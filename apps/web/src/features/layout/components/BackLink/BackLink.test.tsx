import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Routes } from "@/lib/routes"
import { BackLink } from "./BackLink"

afterEach(() => {
  cleanup()
})

describe("BackLink", () => {
  it("links to the given route, labelled by its children", () => {
    render(<BackLink href={Routes.PROPOSALS.ROOT}>Proposals</BackLink>)

    expect(screen.getByRole("link", { name: "Proposals" })).toHaveAttribute(
      "href",
      Routes.PROPOSALS.ROOT,
    )
  })

  it("hides the arrow from the accessible name", () => {
    const { container } = render(<BackLink href={Routes.MEMBERS.ROOT}>Members</BackLink>)

    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
  })
})
