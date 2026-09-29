import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { updateMemberPosition } from "../../actions/updateMemberPosition"
import { MemberPositionEditor } from "./PositionEditor"

vi.mock("../../actions/updateMemberPosition", () => ({ updateMemberPosition: vi.fn() }))

const rest = "University of Auckland - NZ"

describe("MemberPositionEditor", () => {
  beforeEach(() => {
    vi.mocked(updateMemberPosition).mockReset().mockResolvedValue({ ok: true })
  })

  afterEach(() => {
    cleanup()
  })

  it("shows the full affiliation line with an Edit button", () => {
    render(<MemberPositionEditor position="Senior Lecturer" rest={rest} />)

    expect(screen.getByText("Senior Lecturer - University of Auckland - NZ")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument()
  })

  it("prompts for a position when there's nothing to show", () => {
    render(<MemberPositionEditor position="" rest="" />)

    expect(screen.getByText("Add your position")).toBeInTheDocument()
  })

  it("edits only the position, keeping the institution read-only beside it", async () => {
    const user = userEvent.setup()
    render(<MemberPositionEditor position="Senior Lecturer" rest={rest} />)

    await user.click(screen.getByRole("button", { name: "Edit" }))

    expect(screen.getByRole("textbox", { name: "Position" })).toHaveValue("Senior Lecturer")
    expect(screen.getByRole("textbox", { name: "Position" })).toHaveFocus()
    expect(screen.getByText(`- ${rest}`)).toBeInTheDocument()
  })

  it("saves the new position and shows it in the affiliation line", async () => {
    const user = userEvent.setup()
    render(<MemberPositionEditor position="Lecturer" rest={rest} />)

    await user.click(screen.getByRole("button", { name: "Edit" }))
    await user.clear(screen.getByRole("textbox", { name: "Position" }))
    await user.type(screen.getByRole("textbox", { name: "Position" }), "Professor")
    await user.click(screen.getByRole("button", { name: "Done" }))

    expect(updateMemberPosition).toHaveBeenCalledWith("Professor")
    expect(await screen.findByText("Professor - University of Auckland - NZ")).toBeInTheDocument()
  })

  it("shows the error and stays in edit mode when saving fails", async () => {
    vi.mocked(updateMemberPosition).mockResolvedValue({
      formError: "Could not save your position. Try again.",
      ok: false,
    })
    const user = userEvent.setup()
    render(<MemberPositionEditor position="Lecturer" rest={rest} />)

    await user.click(screen.getByRole("button", { name: "Edit" }))
    await user.click(screen.getByRole("button", { name: "Done" }))

    expect(await screen.findByText("Could not save your position. Try again.")).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Position" })).toBeInTheDocument()
  })
})
