import { SELF_NOT_FOUND_WARNING } from "@repo/shared/utils/bibtex-import"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { BibtexImport } from "./BibtexImport"
import { BIBTEX_DEBOUNCE_MS } from "./BibtexImport.constants"

const self = { firstName: "Anna", lastName: "Smith" }

const ENTRY =
  "@article{smith2024, title={Learning}, author={Smith, Anna and Lee, Ben}, year={2024}}"

const trigger = () => screen.getByRole("button", { name: "Import from BibTeX" })
const textbox = () =>
  screen.getByRole<HTMLTextAreaElement>("textbox", { name: "Paste a BibTeX entry" })

// userEvent waits on a real setTimeout between actions, which never fires under
// fake timers, so these tests use fireEvent.
const renderImport = () => {
  const onImport = vi.fn()
  render(<BibtexImport onImport={onImport} self={self} />)
  return { onImport }
}

const enter = (text: string) => fireEvent.change(textbox(), { target: { value: text } })

// A paste into the empty text area. fireEvent does not insert the text, so change it too.
const paste = (text: string) => {
  fireEvent.paste(textbox(), { clipboardData: { getData: () => text } })
  enter(text)
}

// Async, so the lazily loaded parser resolves inside the same act().
const advance = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })

describe("BibtexImport", () => {
  beforeEach(() => {
    // Only the debounce needs fake time. Base UI waits on animation frames to open the panel.
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it("starts open", () => {
    render(<BibtexImport onImport={vi.fn()} self={self} />)
    expect(trigger()).toHaveAttribute("aria-expanded", "true")
    expect(textbox()).toBeInTheDocument()
  })

  it("imports a pasted entry at once, collapses and shows the result", async () => {
    const { onImport } = renderImport()
    paste(ENTRY)
    await advance(0)

    expect(onImport).toHaveBeenCalledTimes(1)
    expect(onImport.mock.calls[0]?.[0]).toMatchObject({
      values: { title: "Learning", year: 2024, citationKey: "smith2024" },
      authors: [
        { kind: "self", name: "Anna Smith" },
        { kind: "external", name: "Ben Lee" },
      ],
      coAuthorNames: [{ name: { given: ["ben"], family: "lee" } }],
    })
    expect(trigger()).toHaveAttribute("aria-expanded", "false")
    expect(screen.getByText(/Filled 5 fields from BibTeX/)).toBeInTheDocument()

    // The debounced parse of the same text does not import it again.
    await advance(BIBTEX_DEBOUNCE_MS)
    expect(onImport).toHaveBeenCalledTimes(1)
  })

  it("only previews typed text and stays open after a pause", async () => {
    const { onImport } = renderImport()
    enter(ENTRY)
    await advance(BIBTEX_DEBOUNCE_MS)

    expect(onImport).not.toHaveBeenCalled()
    expect(trigger()).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByText(/Ready to fill 5 fields/)).toBeInTheDocument()
  })

  it("imports typed text with the button", async () => {
    const { onImport } = renderImport()
    enter(ENTRY)
    fireEvent.click(screen.getByRole("button", { name: "Import" }))
    await advance(0)

    expect(onImport).toHaveBeenCalledTimes(1)
    expect(trigger()).toHaveAttribute("aria-expanded", "false")
  })

  it("imports with Ctrl+Enter or Cmd+Enter, but not Enter alone", async () => {
    const { onImport } = renderImport()
    enter(ENTRY)
    fireEvent.keyDown(textbox(), { key: "Enter" })
    await advance(0)
    expect(onImport).not.toHaveBeenCalled()

    fireEvent.keyDown(textbox(), { key: "Enter", ctrlKey: true })
    await advance(0)
    expect(onImport).toHaveBeenCalledTimes(1)

    fireEvent.click(trigger())
    enter(ENTRY.replace("Learning", "Teaching"))
    fireEvent.keyDown(textbox(), { key: "Enter", metaKey: true })
    await advance(0)
    expect(onImport).toHaveBeenCalledTimes(2)
    expect(onImport.mock.calls[1]?.[0]).toMatchObject({ values: { title: "Teaching" } })
  })

  it("does not import a paste into part of the text", async () => {
    const { onImport } = renderImport()
    enter("@article{k, title={T")
    textbox().setSelectionRange(5, 5)
    fireEvent.paste(textbox(), { clipboardData: { getData: () => ENTRY } })
    await advance(0)

    expect(onImport).not.toHaveBeenCalled()
  })

  it("enables Re-import only after the text changes", async () => {
    renderImport()
    expect(screen.getByRole("button", { name: "Import" })).toBeDisabled()
    paste(ENTRY)
    await advance(0)

    fireEvent.click(trigger())
    expect(screen.getByRole("button", { name: "Re-import" })).toBeDisabled()
    enter(ENTRY.replace("2024", "2025"))
    expect(screen.getByRole("button", { name: "Re-import" })).toBeEnabled()
  })

  it("shows an error and stays open for text it cannot read", async () => {
    const { onImport } = renderImport()
    enter("not bibtex")
    await advance(BIBTEX_DEBOUNCE_MS)

    expect(onImport).not.toHaveBeenCalled()
    expect(screen.getByText(/Could not read this BibTeX/)).toBeInTheDocument()
    expect(screen.queryByText(/Filled/)).not.toBeInTheDocument()
    expect(textbox()).toBeInTheDocument()
  })

  it("shows the warning when the member is not an author", async () => {
    const { onImport } = renderImport()
    paste("@article{k, title={T}, author={Ben Lee}, year={2020}}")
    await advance(0)

    expect(onImport).toHaveBeenCalledTimes(1)
    expect(screen.getByText(SELF_NOT_FOUND_WARNING)).toBeInTheDocument()
  })

  it("clears the result when the text is removed", async () => {
    renderImport()
    enter("not bibtex")
    await advance(BIBTEX_DEBOUNCE_MS)
    expect(screen.getByText(/Could not read this BibTeX/)).toBeInTheDocument()

    enter("")
    await advance(BIBTEX_DEBOUNCE_MS)
    expect(screen.queryByText(/Could not read this BibTeX/)).not.toBeInTheDocument()
  })

  it("keeps the text and does not import it again after a whitespace change", async () => {
    const { onImport } = renderImport()
    paste(ENTRY)
    await advance(0)

    fireEvent.click(trigger())
    expect(textbox()).toHaveValue(ENTRY)
    enter(`${ENTRY} `)
    fireEvent.keyDown(textbox(), { key: "Enter", ctrlKey: true })
    await advance(BIBTEX_DEBOUNCE_MS)

    expect(onImport).toHaveBeenCalledTimes(1)
  })

  it("shows an error and stays open when applying the import fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    const onImport = vi.fn(() => {
      throw new Error("boom")
    })
    render(<BibtexImport onImport={onImport} self={self} />)
    paste(ENTRY)
    await advance(0)

    expect(screen.getByText(/Could not import this entry/)).toBeInTheDocument()
    expect(screen.queryByText(/Filled/)).not.toBeInTheDocument()
    expect(trigger()).toHaveAttribute("aria-expanded", "true")
  })
})
