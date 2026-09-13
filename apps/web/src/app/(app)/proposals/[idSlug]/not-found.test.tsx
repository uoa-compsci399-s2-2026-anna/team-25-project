import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Routes } from "@/lib/routes"
import NotFound from "./not-found"

vi.mock("@/features/auth/components/MemberOnly/MemberOnly", () => ({
  MemberOnly: ({ children }: { children: React.ReactNode }) => children,
}))

describe("proposal not-found page", () => {
  afterEach(() => {
    cleanup()
  })

  it("links back to the proposals list", () => {
    render(<NotFound />)
    expect(screen.getByRole("button", { name: "Browse proposals" })).toHaveAttribute(
      "href",
      Routes.PROPOSALS.ROOT,
    )
  })
})
