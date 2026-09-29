import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { updateMemberBio } from "../../actions/updateMemberBio"
import { MemberBioEditor } from "./BioEditor"

vi.mock("../../actions/updateMemberBio", () => ({ updateMemberBio: vi.fn() }))

describe("MemberBioEditor", () => {
  beforeEach(() => {
    vi.mocked(updateMemberBio).mockReset().mockResolvedValue({ ok: true })
  })

  afterEach(() => {
    cleanup()
  })

  it("shows the bio with an Edit button", () => {
    render(<MemberBioEditor bio="Researches peer assessment." />)

    expect(screen.getByText("Researches peer assessment.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument()
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
  })

  it("switches to a focused text box when Edit is clicked", async () => {
    const user = userEvent.setup()
    render(<MemberBioEditor bio="Old bio" />)

    await user.click(screen.getByRole("button", { name: "Edit" }))

    expect(screen.getByRole("textbox")).toHaveValue("Old bio")
    expect(screen.getByRole("textbox")).toHaveFocus()
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument()
  })

  it("saves the new bio and goes back to showing it", async () => {
    const user = userEvent.setup()
    render(<MemberBioEditor bio="Old bio" />)

    await user.click(screen.getByRole("button", { name: "Edit" }))
    await user.clear(screen.getByRole("textbox"))
    await user.type(screen.getByRole("textbox"), "New bio")
    await user.click(screen.getByRole("button", { name: "Done" }))

    expect(updateMemberBio).toHaveBeenCalledWith("New bio")
    expect(await screen.findByText("New bio")).toBeInTheDocument()
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
  })

  it("shows the error and stays in edit mode when saving fails", async () => {
    vi.mocked(updateMemberBio).mockResolvedValue({ formError: "Bio must be text.", ok: false })
    const user = userEvent.setup()
    render(<MemberBioEditor bio="Old bio" />)

    await user.click(screen.getByRole("button", { name: "Edit" }))
    await user.click(screen.getByRole("button", { name: "Done" }))

    expect(await screen.findByText("Bio must be text.")).toBeInTheDocument()
    expect(screen.getByRole("textbox")).toBeInTheDocument()
  })
})
