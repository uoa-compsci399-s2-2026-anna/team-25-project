import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Badge } from "./badge"

describe("Badge", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders children", () => {
    render(<Badge>Badge</Badge>)
    expect(screen.getByText("Badge")).toBeInTheDocument()
  })

  it("applies the default variant classes", () => {
    render(<Badge>Badge</Badge>)
    expect(screen.getByText("Badge")).toHaveClass("bg-primary", "text-primary-foreground")
  })

  it("applies variant classes when passed", () => {
    render(<Badge variant="destructive">Badge</Badge>)
    expect(screen.getByText("Badge")).toHaveClass("bg-destructive/10", "text-destructive")
  })

  it("merges a custom className with variant classes", () => {
    render(<Badge className="custom-class">Badge</Badge>)
    expect(screen.getByText("Badge")).toHaveClass("custom-class")
  })

  it("renders as a different element when the render prop is passed", () => {
    render(<Badge render={<a href="/badges" />}>Link badge</Badge>)
    expect(screen.getByRole("link", { name: "Link badge" })).toBeInTheDocument()
  })
})
