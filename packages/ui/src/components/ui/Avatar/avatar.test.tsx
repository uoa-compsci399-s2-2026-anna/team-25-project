import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from "./avatar"

describe("Avatar", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders the fallback when there is no image", () => {
    render(
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>,
    )
    expect(screen.getByText("JD")).toBeInTheDocument()
  })

  it("merges a custom className with the default classes", () => {
    render(
      <Avatar className="custom-class">
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>,
    )
    expect(screen.getByText("JD").closest("[data-slot=avatar]")).toHaveClass("custom-class")
  })

  it("shows the fallback when the image fails to load", () => {
    render(
      <Avatar>
        <AvatarImage alt="User" src="/broken-image.png" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>,
    )
    expect(screen.getByText("JD")).toBeVisible()
    expect(screen.queryByRole("img")).not.toBeInTheDocument()
  })

  it("defaults to the default size", () => {
    render(
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>,
    )
    expect(screen.getByText("JD").closest("[data-slot=avatar]")).toHaveAttribute(
      "data-size",
      "default",
    )
  })

  it("scales the avatar and its initials at the xl size", () => {
    render(
      <Avatar size="xl">
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>,
    )
    const avatar = screen.getByText("JD").closest("[data-slot=avatar]")

    expect(avatar).toHaveAttribute("data-size", "xl")
    // A plain size class cannot override the data-modifier, so the size has to
    // stay expressed this way or the avatar silently renders at 32px.
    expect(avatar).toHaveClass("data-[size=xl]:size-24")
    // Initials are a fixed text-sm otherwise, which is lost on a 96px circle.
    expect(screen.getByText("JD")).toHaveClass("group-data-[size=xl]/avatar:text-2xl")
  })
})

describe("AvatarGroup", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders multiple avatars inside AvatarGroup", () => {
    render(
      <AvatarGroup>
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>AS</AvatarFallback>
        </Avatar>
      </AvatarGroup>,
    )
    expect(screen.getByText("JD")).toBeInTheDocument()
    expect(screen.getByText("AS")).toBeInTheDocument()
  })

  it("renders AvatarGroupCount", () => {
    render(<AvatarGroupCount>+3</AvatarGroupCount>)
    expect(screen.getByText("+3")).toBeInTheDocument()
  })
})
