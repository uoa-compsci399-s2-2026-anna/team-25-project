import { SELF_NOT_FOUND_WARNING } from "@repo/shared/utils/bibtex-import"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { BIBTEX_DEBOUNCE_MS, BibtexImport } from "./BibtexImport"

const self = { firstName: "Anna", lastName: "Smith" }

const ENTRY =
  "@article{smith2024, title={Learning}, author={Smith, Anna and Lee, Ben}, year={2024}}"

const trigger = () => screen.getByRole("button", { name: "Import from BibTeX" })
const textbox = () => screen.getByRole("textbox", { name: "Paste a BibTeX entry" })

// userEvent waits on a real setTimeout between actions, which never fires under
// fake timers, so these tests use fireEvent.
const renderImport = () => {
  const onImport = vi.fn()
  render(<BibtexImport onImport={onImport} self={self} />)
  return { onImport }
}

const enter = (text: string) => fireEvent.change(textbox(), { target: { value: text } })

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

  it("imports after the debounce, collapses and shows the result", async () => {
    const { onImport } = renderImport()
    enter(ENTRY)

    await advance(BIBTEX_DEBOUNCE_MS - 1)
    expect(onImport).not.toHaveBeenCalled()

    await advance(1)
    expect(onImport).toHaveBeenCalledTimes(1)
    expect(onImport.mock.calls[0]?.[0]).toMatchObject({
      values: { title: "Learning", year: 2024, citationKey: "smith2024" },
      authors: [{ kind: "self" }, { kind: "coAuthor", name: "Ben Lee" }],
    })
    expect(trigger()).toHaveAttribute("aria-expanded", "false")
    expect(screen.getByText(/Filled 5 fields from BibTeX/)).toBeInTheDocument()
  })

  it("restarts the debounce while the user types", async () => {
    const { onImport } = renderImport()
    enter(ENTRY.slice(0, 20))
    await advance(BIBTEX_DEBOUNCE_MS - 100)
    enter(ENTRY)
    await advance(BIBTEX_DEBOUNCE_MS - 100)
    expect(onImport).not.toHaveBeenCalled()

    await advance(100)
    expect(onImport).toHaveBeenCalledTimes(1)
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
    enter("@article{k, title={T}, author={Ben Lee}, year={2020}}")
    await advance(BIBTEX_DEBOUNCE_MS)

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
    enter(ENTRY)
    await advance(BIBTEX_DEBOUNCE_MS)

    fireEvent.click(trigger())
    expect(textbox()).toHaveValue(ENTRY)
    enter(`${ENTRY} `)
    await advance(BIBTEX_DEBOUNCE_MS)

    expect(onImport).toHaveBeenCalledTimes(1)
  })

  it("shows an error and stays open when applying the import fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    const onImport = vi.fn(() => {
      throw new Error("boom")
    })
    render(<BibtexImport onImport={onImport} self={self} />)
    enter(ENTRY)
    await advance(BIBTEX_DEBOUNCE_MS)

    expect(screen.getByText(/Could not import this entry/)).toBeInTheDocument()
    expect(screen.queryByText(/Filled/)).not.toBeInTheDocument()
    expect(trigger()).toHaveAttribute("aria-expanded", "true")
  })
})
