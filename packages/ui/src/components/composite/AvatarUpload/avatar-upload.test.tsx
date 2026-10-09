import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { AvatarUpload } from "./avatar-upload"

describe("AvatarUpload", () => {
  afterEach(() => {
    cleanup()
  })

  it("opens the file picker when clicked", () => {
    const { container } = render(<AvatarUpload fallback="JD" />)
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')
    if (!input) throw new Error("file input not found")
    const clickSpy = vi.spyOn(input, "click")
    fireEvent.click(screen.getByRole("button", { name: "Upload photo" }))
    expect(clickSpy).toHaveBeenCalledTimes(1)
  })

  it("calls onFileSelect and shows a preview when a file is chosen", () => {
    vi.stubGlobal("URL", { ...URL, createObjectURL: vi.fn(() => "blob:mock-url") })

    const onFileSelect = vi.fn()
    const { container } = render(<AvatarUpload fallback="JD" onFileSelect={onFileSelect} />)
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')
    if (!input) throw new Error("file input not found")

    const file = new File(["photo"], "photo.png", { type: "image/png" })
    fireEvent.change(input, { target: { files: [file] } })

    expect(onFileSelect).toHaveBeenCalledWith(file)
    expect(URL.createObjectURL).toHaveBeenCalledWith(file)

    vi.unstubAllGlobals()
  })

  it("does not call onFileSelect when no file is chosen", () => {
    const onFileSelect = vi.fn()
    const { container } = render(<AvatarUpload fallback="JD" onFileSelect={onFileSelect} />)
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')
    if (!input) throw new Error("file input not found")
    fireEvent.change(input, { target: { files: [] } })
    expect(onFileSelect).not.toHaveBeenCalled()
  })

  it("disables the picker when disabled", () => {
    render(<AvatarUpload disabled fallback="JD" />)
    expect(screen.getByRole("button", { name: "Upload photo" })).toBeDisabled()
  })

  it("forwards the xxl size to the avatar", () => {
    const { container } = render(<AvatarUpload fallback="JD" size="xxl" />)
    expect(container.querySelector('[data-size="xxl"]')).toBeInTheDocument()
  })
})
