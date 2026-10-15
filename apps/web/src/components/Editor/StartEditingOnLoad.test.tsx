import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { EditButton } from "./EditButton"
import { EditProvider } from "./EditContext"
import { StartEditingOnLoad } from "./StartEditingOnLoad"

const renderAt = (url: string) => {
  window.history.replaceState(null, "", url)
  render(
    <EditProvider onSave={async () => ({ ok: true })} validate={() => undefined}>
      <StartEditingOnLoad />
      <EditButton />
    </EditProvider>,
  )
}

describe("StartEditingOnLoad", () => {
  afterEach(() => {
    cleanup()
    window.history.replaceState(null, "", "/")
  })

  it("starts editing when the page opens with #edit, then drops the fragment", () => {
    renderAt("/proposals/2-slug?tab=1#edit")

    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument()
    expect(window.location.hash).toBe("")
    expect(`${window.location.pathname}${window.location.search}`).toBe("/proposals/2-slug?tab=1")
  })

  it("does nothing without it", () => {
    renderAt("/proposals/2-slug#comments")

    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument()
    expect(window.location.hash).toBe("#comments")
  })
})
