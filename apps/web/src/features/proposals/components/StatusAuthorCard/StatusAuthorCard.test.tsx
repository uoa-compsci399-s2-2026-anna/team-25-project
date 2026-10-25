import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it } from "vitest"
import { z } from "zod"
import { EditProvider, useEdit } from "@/components/Editor/EditContext"
import { StatusAuthorCard } from "./StatusAuthorCard"

// Editing is started from the title's dropdown, not this card - a harness
// button stands in for it, as on the proposal page.
const StartEditingButton = () => {
  const { startEditing } = useEdit()
  return (
    <button onClick={startEditing} type="button">
      start editing (test harness)
    </button>
  )
}

const inEditor = (ui: ReactNode) => (
  <EditProvider onSave={async () => ({ ok: true })} schema={z.object({})}>
    <StartEditingButton />
    {ui}
  </EditProvider>
)

describe("StatusAuthorCard", () => {
  afterEach(() => {
    cleanup()
  })

  it("selects the Active tab when the proposal is active", async () => {
    render(inEditor(<StatusAuthorCard status="active" updatedAt="2026-08-05T00:00:00.000Z" />))
    // The status tabs only show while editing.
    await userEvent.click(screen.getByRole("button", { name: "start editing (test harness)" }))
    expect(screen.getByRole("tab", { name: "Active" })).toHaveAttribute("data-active")
  })

  it("selects the Closed tab when the proposal is closed", async () => {
    render(inEditor(<StatusAuthorCard status="closed" updatedAt="2026-08-05T00:00:00.000Z" />))
    // The status tabs only show while editing.
    await userEvent.click(screen.getByRole("button", { name: "start editing (test harness)" }))
    expect(screen.getByRole("tab", { name: "Closed" })).toHaveAttribute("data-active")
  })

  it("has no edit control of its own - that lives in the title's dropdown", () => {
    render(inEditor(<StatusAuthorCard status="active" updatedAt="2026-08-05T00:00:00.000Z" />))
    expect(screen.queryByRole("button", { name: "Edit proposal" })).not.toBeInTheDocument()
  })

  it("renders the formatted last-edited date", () => {
    render(inEditor(<StatusAuthorCard status="active" updatedAt="2026-08-05T00:00:00.000Z" />))
    expect(screen.getByText("Last edited 5 Aug 2026")).toBeInTheDocument()
  })
})
