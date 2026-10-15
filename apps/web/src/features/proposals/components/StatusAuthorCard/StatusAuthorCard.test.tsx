import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it } from "vitest"
import { EditProvider } from "@/components/Editor/EditContext"
import { StatusAuthorCard } from "./StatusAuthorCard"

// The card's Edit button needs an editor around it, as on the proposal page.
const renderInEditor = (ui: ReactNode) =>
  render(
    <EditProvider onSave={async () => ({ ok: true })} validate={() => undefined}>
      {ui}
    </EditProvider>,
  )

describe("StatusAuthorCard", () => {
  afterEach(() => {
    cleanup()
  })

  it("selects the Active tab when the proposal is active", () => {
    renderInEditor(<StatusAuthorCard status="active" updatedAt="2026-08-05T00:00:00.000Z" />)
    expect(screen.getByRole("tab", { name: "Active" })).toHaveAttribute("data-active")
  })

  it("selects the Closed tab when the proposal is closed", () => {
    renderInEditor(<StatusAuthorCard status="closed" updatedAt="2026-08-05T00:00:00.000Z" />)
    expect(screen.getByRole("tab", { name: "Closed" })).toHaveAttribute("data-active")
  })

  it("renders the Edit proposal button, which starts editing", async () => {
    const user = userEvent.setup()
    renderInEditor(<StatusAuthorCard status="active" updatedAt="2026-08-05T00:00:00.000Z" />)

    await user.click(screen.getByRole("button", { name: "Edit proposal" }))

    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument()
  })

  it("renders the formatted last-edited date", () => {
    renderInEditor(<StatusAuthorCard status="active" updatedAt="2026-08-05T00:00:00.000Z" />)
    expect(screen.getByText("Last edited 5 Aug 2026")).toBeInTheDocument()
  })
})
