import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Routes } from "@/lib/routes"
import { JoinCommunityBand } from "./JoinCommunityBand"

describe("JoinCommunityBand", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders the heading", () => {
    render(<JoinCommunityBand />)
    expect(
      screen.getByRole("heading", { level: 2, name: "Want to be a part of the community?" }),
    ).toBeInTheDocument()
  })

  it("links Become a member to the register flow", () => {
    render(<JoinCommunityBand />)
    expect(screen.getByRole("button", { name: "Become a member" })).toHaveAttribute(
      "href",
      Routes.REGISTER.ROOT,
    )
  })
})
