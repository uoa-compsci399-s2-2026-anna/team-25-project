import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Avatar, AvatarFallback, AvatarUpload } from "./avatar"

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
})

describe("AvatarUpload", () => {
  afterEach(() => {
    cleanup()
  })

  it("opens the file picker when clicked", () => {
    render(<AvatarUpload fallback="JD" />)
    const input = screen.getByLabelText("Upload photo")
    const clickSpy = vi.spyOn(input, "click")
    fireEvent.click(screen.getByRole("button"))
    expect(clickSpy).toHaveBeenCalledTimes(1)
  })

  it("calls onFileSelect and shows a preview when a file is chosen", () => {
    vi.stubGlobal("URL", { ...URL, createObjectURL: vi.fn(() => "blob:mock-url") })

    const onFileSelect = vi.fn()
    render(<AvatarUpload fallback="JD" onFileSelect={onFileSelect} />)

    const file = new File(["photo"], "photo.png", { type: "image/png" })
    const input = screen.getByLabelText("Upload photo")
    fireEvent.change(input, { target: { files: [file] } })

    expect(onFileSelect).toHaveBeenCalledWith(file)
    expect(URL.createObjectURL).toHaveBeenCalledWith(file)

    vi.unstubAllGlobals()
  })
})
