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
