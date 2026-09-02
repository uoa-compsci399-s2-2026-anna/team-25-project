import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it } from "vitest"
import { Label } from "./label"

describe("Label", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders children", () => {
    render(<Label htmlFor="email">Email</Label>)
    expect(screen.getByText("Email")).toBeInTheDocument()
  })

  it("merges a custom className with the default classes", () => {
    render(
      <Label className="custom-class" htmlFor="email">
        Email
      </Label>,
    )
    expect(screen.getByText("Email")).toHaveClass("custom-class")
  })

  it("focuses the paired input when clicked", async () => {
    const user = userEvent.setup()
    const id = crypto.randomUUID()
    render(
      <>
        <Label htmlFor={id}>Email</Label>
        <input id={id} type="text" />
      </>,
    )
    await user.click(screen.getByText("Email"))
    expect(screen.getByRole("textbox")).toHaveFocus()
  })
})
