import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"
import { EditButton } from "./EditButton"
import { EditProvider, zodFormErrors } from "./EditContext"
import { EditNumberInput } from "./EditNumberInput"

const schema = z.object({
  year: z.number({ error: "Year is required" }).min(2000, "Too early"),
})

const renderEditable = (onSave = vi.fn().mockResolvedValue({ ok: true })) => {
  render(
    <EditProvider onSave={onSave} validate={zodFormErrors(schema)}>
      <EditNumberInput label="Year" name="year" value={2027} view={<span>2027 view</span>} />
      <EditButton />
    </EditProvider>,
  )
  return onSave
}

describe("EditNumberInput", () => {
  afterEach(() => {
    cleanup()
  })

  it("starts from the saved number and sends the edited one as a number", async () => {
    const user = userEvent.setup()
    const onSave = renderEditable()

    await user.click(screen.getByRole("button", { name: "Edit" }))
    const input = screen.getByRole("spinbutton", { name: "Year" })
    expect(input).toHaveValue(2027)

    await user.clear(input)
    await user.type(input, "2030")
    await user.click(screen.getByRole("button", { name: "Done" }))

    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ year: 2030 }))
  })

  it("treats an empty box as missing, not 0, and won't save it", async () => {
    const user = userEvent.setup()
    const onSave = renderEditable()

    await user.click(screen.getByRole("button", { name: "Edit" }))
    await user.clear(screen.getByRole("spinbutton", { name: "Year" }))
    await user.click(screen.getByRole("button", { name: "Done" }))

    expect(await screen.findByText("Year is required")).toBeInTheDocument()
    expect(screen.queryByText("Too early")).not.toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })
})
