import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { updateMemberResearchInterests } from "../../actions/updateMemberResearchInterests"
import { MemberResearchInterestEditor } from "./ResearchInterestEditor"

vi.mock("../../actions/updateMemberResearchInterests", () => ({
  updateMemberResearchInterests: vi.fn(),
}))

const renderEditor = () =>
  render(<MemberResearchInterestEditor interests={["Code review", "Generative AI"]} />)

describe("MemberResearchInterestEditor", () => {
  beforeEach(() => {
    vi.mocked(updateMemberResearchInterests).mockReset().mockResolvedValue({ ok: true })
  })

  afterEach(() => {
    cleanup()
  })

  it("shows the interests as badges with an Edit button", () => {
    renderEditor()

    expect(screen.getByText("Code review")).toBeInTheDocument()
    expect(screen.getByText("Generative AI")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument()
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
  })

  it("turns each interest into an input when Edit is clicked", async () => {
    const user = userEvent.setup()
    renderEditor()

    await user.click(screen.getByRole("button", { name: "Edit" }))

    const inputs = screen.getAllByRole("textbox")
    expect(inputs.map((input) => (input as HTMLInputElement).value)).toEqual([
      "Code review",
      "Generative AI",
    ])
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument()
  })

  it("saves edited, removed and added interests, dropping empty ones", async () => {
    const user = userEvent.setup()
    renderEditor()

    await user.click(screen.getByRole("button", { name: "Edit" }))
    // Rename the first interest.
    const [first] = screen.getAllByRole("textbox")
    if (!first) throw new Error("first interest input not found")
    await user.clear(first)
    await user.type(first, "Peer review")
    // Remove the second.
    const removeButtons = screen.getAllByRole("button", { name: "-" })
    await user.click(removeButtons[1] as HTMLElement)
    // Add one, plus an empty one that should be dropped.
    await user.click(screen.getByRole("button", { name: "+" }))
    await user.type(screen.getAllByRole("textbox")[1] as HTMLElement, "Assessment")
    await user.click(screen.getByRole("button", { name: "+" }))
    await user.click(screen.getByRole("button", { name: "Done" }))

    expect(updateMemberResearchInterests).toHaveBeenCalledWith(["Peer review", "Assessment"])
    expect(await screen.findByRole("button", { name: "Edit" })).toBeInTheDocument()
  })

  it("shows the error and stays in edit mode when saving fails", async () => {
    vi.mocked(updateMemberResearchInterests).mockResolvedValue({
      formError: "Add up to 10 research interests",
      ok: false,
    })
    const user = userEvent.setup()
    renderEditor()

    await user.click(screen.getByRole("button", { name: "Edit" }))
    await user.click(screen.getByRole("button", { name: "Done" }))

    expect(await screen.findByText("Add up to 10 research interests")).toBeInTheDocument()
    expect(screen.getAllByRole("textbox")).toHaveLength(2)
  })

  it("starts each edit from the interests it was given, not leftover edits", async () => {
    const user = userEvent.setup()
    renderEditor()

    await user.click(screen.getByRole("button", { name: "Edit" }))
    await user.click(screen.getAllByRole("button", { name: "-" })[0] as HTMLElement)
    await user.click(screen.getByRole("button", { name: "Done" }))
    await user.click(await screen.findByRole("button", { name: "Edit" }))

    expect(screen.getAllByRole("textbox")).toHaveLength(2)
  })
})
