import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { updateMemberAvatar } from "../../actions/updateMemberAvatar"
import { MemberAvatarEditor } from "./AvatarEditor"

vi.mock("../../actions/updateMemberAvatar", () => ({ updateMemberAvatar: vi.fn() }))

const png = () => new File(["photo"], "photo.png", { type: "image/png" })

const renderEditor = () => {
  const { container } = render(<MemberAvatarEditor fallback="AT" />)
  const input = container.querySelector<HTMLInputElement>('input[type="file"]')
  if (!input) throw new Error("file input not found")
  return input
}

describe("MemberAvatarEditor", () => {
  beforeEach(() => {
    vi.mocked(updateMemberAvatar).mockReset().mockResolvedValue({ ok: true })
    // jsdom has no object URLs; AvatarUpload uses one for the local preview.
    vi.stubGlobal("URL", { ...URL, createObjectURL: vi.fn(() => "blob:mock-url") })
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it("renders the upload button with the initials fallback", () => {
    renderEditor()

    expect(screen.getByRole("button", { name: "Upload photo" })).toBeInTheDocument()
    expect(screen.getByText("AT")).toBeInTheDocument()
  })

  it("uploads the chosen photo straight away", async () => {
    const user = userEvent.setup()
    const input = renderEditor()
    const file = png()

    await user.upload(input, file)

    await waitFor(() => expect(updateMemberAvatar).toHaveBeenCalledTimes(1))
    const formData = vi.mocked(updateMemberAvatar).mock.calls[0]?.[0]
    expect(formData?.get("avatar")).toBe(file)
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("refuses a photo over 4 MB without calling the server", async () => {
    const user = userEvent.setup()
    const input = renderEditor()
    const big = png()
    Object.defineProperty(big, "size", { value: 4 * 1024 * 1024 + 1 })

    await user.upload(input, big)

    expect(await screen.findByText("Your photo must be 4 MB or smaller.")).toBeInTheDocument()
    expect(updateMemberAvatar).not.toHaveBeenCalled()
  })

  it("shows the server's error when the upload fails", async () => {
    vi.mocked(updateMemberAvatar).mockResolvedValue({
      formError: "Could not upload your photo. Try again.",
      ok: false,
    })
    const user = userEvent.setup()
    const input = renderEditor()

    await user.upload(input, png())

    expect(await screen.findByText("Could not upload your photo. Try again.")).toBeInTheDocument()
  })
})
