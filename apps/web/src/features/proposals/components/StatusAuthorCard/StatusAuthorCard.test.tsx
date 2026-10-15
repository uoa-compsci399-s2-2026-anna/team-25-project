import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it } from "vitest"
import { EditProvider } from "@/components/Editor/EditContext"
import { StatusAuthorCard } from "./StatusAuthorCard"

// The card's Edit button needs an editor around it, as on the proposal page.
const inEditor = (ui: ReactNode) => (
  <EditProvider onSave={async () => ({ ok: true })} validate={() => undefined}>
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
    await userEvent.click(screen.getByRole("button", { name: "Edit proposal" }))
    expect(screen.getByRole("tab", { name: "Active" })).toHaveAttribute("data-active")
  })

  it("selects the Closed tab when the proposal is closed", async () => {
    render(inEditor(<StatusAuthorCard status="closed" updatedAt="2026-08-05T00:00:00.000Z" />))
    // The status tabs only show while editing.
    await userEvent.click(screen.getByRole("button", { name: "Edit proposal" }))
    expect(screen.getByRole("tab", { name: "Closed" })).toHaveAttribute("data-active")
  })

  it("renders the Edit proposal button", () => {
    render(inEditor(<StatusAuthorCard status="active" updatedAt="2026-08-05T00:00:00.000Z" />))
    expect(screen.getByRole("button", { name: "Edit proposal" })).toBeInTheDocument()
  })

  it("renders the formatted last-edited date", () => {
    render(inEditor(<StatusAuthorCard status="active" updatedAt="2026-08-05T00:00:00.000Z" />))
    expect(screen.getByText("Last edited 5 Aug 2026")).toBeInTheDocument()
  })
})
