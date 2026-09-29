import { MemberTitleLabels } from "@repo/shared/enums/members"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { updateMemberName } from "../../actions/updateMemberName"
import { MemberNameEditor } from "./NameEditor"

vi.mock("../../actions/updateMemberName", () => ({ updateMemberName: vi.fn() }))

const renderEditor = () => render(<MemberNameEditor firstName="Anna" lastName="Tui" title="dr" />)

describe("MemberNameEditor", () => {
  beforeEach(() => {
    vi.mocked(updateMemberName).mockReset().mockResolvedValue({ ok: true })
  })

  afterEach(() => {
    cleanup()
  })

  it("shows the title and name as the heading with an Edit button", () => {
    renderEditor()

    expect(screen.getByRole("heading", { level: 1, name: "Dr Anna Tui" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument()
  })

  it("switches to a title dropdown and name inputs when Edit is clicked", async () => {
    const user = userEvent.setup()
    renderEditor()

    await user.click(screen.getByRole("button", { name: "Edit" }))

    expect(screen.getByRole("combobox", { name: "Title" })).toHaveTextContent("Dr")
    expect(screen.getByRole("textbox", { name: "First name" })).toHaveValue("Anna")
    expect(screen.getByRole("textbox", { name: "First name" })).toHaveFocus()
    expect(screen.getByRole("textbox", { name: "Last name" })).toHaveValue("Tui")
  })

  it("only offers the approved titles, plus None", async () => {
    const user = userEvent.setup()
    renderEditor()

    await user.click(screen.getByRole("button", { name: "Edit" }))
    await user.click(screen.getByRole("combobox", { name: "Title" }))

    const options = (await screen.findAllByRole("option")).map((option) => option.textContent)
    expect(options).toEqual(["None", ...Object.values(MemberTitleLabels)])
  })

  it("saves a new title and name, then shows them in the heading", async () => {
    const user = userEvent.setup()
    renderEditor()

    await user.click(screen.getByRole("button", { name: "Edit" }))
    await user.click(screen.getByRole("combobox", { name: "Title" }))
    await user.click(await screen.findByRole("option", { name: "Prof" }))
    await user.clear(screen.getByRole("textbox", { name: "First name" }))
    await user.type(screen.getByRole("textbox", { name: "First name" }), "Ana")
    await user.click(screen.getByRole("button", { name: "Done" }))

    expect(updateMemberName).toHaveBeenCalledWith({
      title: "prof",
      firstName: "Ana",
      lastName: "Tui",
    })
    expect(
      await screen.findByRole("heading", { level: 1, name: "Prof Ana Tui" }),
    ).toBeInTheDocument()
  })

  it("sends a null title when None is chosen", async () => {
    const user = userEvent.setup()
    renderEditor()

    await user.click(screen.getByRole("button", { name: "Edit" }))
    await user.click(screen.getByRole("combobox", { name: "Title" }))
    await user.click(await screen.findByRole("option", { name: "None" }))
    await user.click(screen.getByRole("button", { name: "Done" }))

    expect(updateMemberName).toHaveBeenCalledWith({
      title: null,
      firstName: "Anna",
      lastName: "Tui",
    })
    expect(await screen.findByRole("heading", { level: 1, name: "Anna Tui" })).toBeInTheDocument()
  })

  it("shows the error and stays in edit mode when saving fails", async () => {
    vi.mocked(updateMemberName).mockResolvedValue({
      formError: "First name is required",
      ok: false,
    })
    const user = userEvent.setup()
    renderEditor()

    await user.click(screen.getByRole("button", { name: "Edit" }))
    await user.clear(screen.getByRole("textbox", { name: "First name" }))
    await user.click(screen.getByRole("button", { name: "Done" }))

    expect(await screen.findByText("First name is required")).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "First name" })).toBeInTheDocument()
  })
})
