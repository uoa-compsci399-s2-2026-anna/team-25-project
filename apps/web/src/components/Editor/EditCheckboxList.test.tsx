import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { EditButton } from "./EditButton"
import { EditCheckboxList } from "./EditCheckboxList"
import { EditProvider } from "./EditContext"

const options = [
  { label: "Assessment", value: "assessment" },
  { label: "Teamwork", value: "teamwork" },
  { label: "Ethics", value: "ethics" },
]

const renderEditable = (value: string[] | null) => {
  const onSave = vi.fn().mockResolvedValue({ ok: true })
  render(
    <EditProvider onSave={onSave} validate={() => undefined}>
      <EditCheckboxList
        label="Tags"
        name="tags"
        options={options}
        value={value}
        view={<span>Tags view</span>}
      />
      <EditButton />
    </EditProvider>,
  )
  return onSave
}

describe("EditCheckboxList", () => {
  afterEach(() => {
    cleanup()
  })

  it("shows the view until editing, then a labelled group with the saved values ticked", async () => {
    const user = userEvent.setup()
    renderEditable(["teamwork"])
    expect(screen.getByText("Tags view")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Edit" }))

    expect(screen.getByRole("group", { name: "Tags" })).toBeInTheDocument()
    expect(screen.getByRole("checkbox", { name: "Teamwork" })).toBeChecked()
    expect(screen.getByRole("checkbox", { name: "Ethics" })).not.toBeChecked()
  })

  it("sends the picked values in the options' order", async () => {
    const user = userEvent.setup()
    const onSave = renderEditable(["teamwork"])

    await user.click(screen.getByRole("button", { name: "Edit" }))
    await user.click(screen.getByRole("checkbox", { name: "Ethics" }))
    await user.click(screen.getByRole("checkbox", { name: "Assessment" }))
    await user.click(screen.getByRole("checkbox", { name: "Teamwork" }))
    await user.click(screen.getByRole("button", { name: "Done" }))

    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ tags: ["assessment", "ethics"] }))
  })

  it("starts from an empty list when nothing is saved", async () => {
    const user = userEvent.setup()
    const onSave = renderEditable(null)

    await user.click(screen.getByRole("button", { name: "Edit" }))
    await user.click(screen.getByRole("button", { name: "Done" }))

    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ tags: [] }))
  })
})
