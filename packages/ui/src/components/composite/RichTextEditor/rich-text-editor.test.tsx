import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  $createParagraphNode,
  $createRangeSelection,
  $createTextNode,
  $getRoot,
  $setSelection,
  type LexicalEditor,
} from "lexical"
import { afterEach, describe, expect, it, vi } from "vitest"
import { RichTextEditor, type RichTextValue } from "./rich-text-editor"

const text = (value: string) => ({
  detail: 0,
  format: 0,
  mode: "normal",
  style: "",
  text: value,
  type: "text",
  version: 1,
})

const doc = (...children: Array<string | Record<string, unknown>>) =>
  ({
    root: {
      children: [
        {
          children: children.map((child) => (typeof child === "string" ? text(child) : child)),
          direction: "ltr",
          format: "",
          indent: 0,
          textFormat: 0,
          textStyle: "",
          type: "paragraph",
          version: 1,
        },
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  }) as unknown as RichTextValue

// Lexical stores its editor on the root element. jsdom cannot type into contenteditable,
// so the tests drive the editor directly.
const getEditor = () => {
  const root = screen.getByRole("textbox") as HTMLElement & { __lexicalEditor: LexicalEditor }
  return root.__lexicalEditor
}

const selectAll = () =>
  act(async () => {
    getEditor().update(() => {
      const first = $getRoot().getFirstDescendant()
      const last = $getRoot().getLastDescendant()
      if (!first || !last) return
      const selection = $createRangeSelection()
      selection.anchor.set(first.getKey(), 0, "text")
      selection.focus.set(last.getKey(), last.getTextContentSize(), "text")
      $setSelection(selection)
    })
  })

const click = (name: string) =>
  act(async () => {
    fireEvent.click(screen.getByRole("button", { name }))
  })

// Toolbar buttons stay focusable when disabled, so they use aria-disabled, not `disabled`.
const isDisabled = (name: string) =>
  screen.getByRole("button", { name }).getAttribute("aria-disabled") === "true"

const lastValue = (onChange: ReturnType<typeof vi.fn>) =>
  onChange.mock.lastCall?.[0] as RichTextValue & {
    root: {
      children: Array<Record<string, unknown> & { children: Array<Record<string, unknown>> }>
    }
  }

describe("RichTextEditor", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders the text of defaultValue", async () => {
    render(<RichTextEditor defaultValue={doc("Hello world")} />)
    expect(await screen.findByText("Hello world")).toBeInTheDocument()
  })

  it("shows the placeholder only while empty", async () => {
    render(<RichTextEditor placeholder="Write here" />)
    expect(await screen.findByText("Write here")).toBeInTheDocument()

    await act(async () => {
      getEditor().update(() => {
        $getRoot()
          .clear()
          .append($createParagraphNode().append($createTextNode("Hi")))
      })
    })
    await waitFor(() => expect(screen.queryByText("Write here")).not.toBeInTheDocument())
  })

  it("renders a labelled toolbar with named buttons", () => {
    render(<RichTextEditor />)
    expect(screen.getByRole("toolbar", { name: "Formatting" })).toBeInTheDocument()
    for (const name of [
      "Undo",
      "Redo",
      "Bold",
      "Italic",
      "Underline",
      "Quote",
      "Bulleted list",
      "Numbered list",
    ]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument()
    }
    expect(screen.getByRole("combobox", { name: "Text style" })).toHaveTextContent("Paragraph")
  })

  it("passes the id and aria attributes to the editable area", () => {
    const id = "body"
    render(<RichTextEditor aria-describedby="hint" aria-invalid aria-labelledby="label" id={id} />)
    const textbox = screen.getByRole("textbox")
    expect(textbox).toHaveAttribute("id", "body")
    expect(textbox).toHaveAttribute("aria-describedby", "hint")
    expect(textbox).toHaveAttribute("aria-invalid", "true")
    expect(textbox).toHaveAttribute("aria-labelledby", "label")
  })

  it("does not call onChange on mount", async () => {
    const onChange = vi.fn()
    render(<RichTextEditor defaultValue={doc("Hello")} onChange={onChange} />)
    await screen.findByText("Hello")
    expect(onChange).not.toHaveBeenCalled()
  })

  it.each([
    ["Bold", 1],
    ["Italic", 2],
    ["Underline", 8],
  ])("applies %s to the selection", async (name, format) => {
    const onChange = vi.fn()
    render(<RichTextEditor defaultValue={doc("Hello")} onChange={onChange} />)
    await selectAll()
    await click(name)

    await waitFor(() =>
      expect(lastValue(onChange).root.children[0].children[0].format).toBe(format),
    )
    expect(screen.getByRole("button", { name })).toHaveAttribute("aria-pressed", "true")
  })

  it.each(["h1", "h2", "h3", "h4", "h5", "h6"])(
    "sets the block to %s from the text style select",
    async (tag) => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<RichTextEditor defaultValue={doc("Hello")} onChange={onChange} />)
      await selectAll()

      const label = `Heading ${tag[1]}`
      await user.click(screen.getByRole("combobox", { name: "Text style" }))
      await user.click(await screen.findByRole("option", { name: label }))

      await waitFor(() =>
        expect(lastValue(onChange).root.children[0]).toMatchObject({ tag, type: "heading" }),
      )
      expect(screen.getByRole("combobox", { name: "Text style" })).toHaveTextContent(label)

      await user.click(screen.getByRole("combobox", { name: "Text style" }))
      await user.click(await screen.findByRole("option", { name: "Paragraph" }))
      await waitFor(() => expect(lastValue(onChange).root.children[0].type).toBe("paragraph"))
    },
  )

  it("toggles the block to a quote and back to a paragraph", async () => {
    const onChange = vi.fn()
    render(<RichTextEditor defaultValue={doc("Hello")} onChange={onChange} />)
    await selectAll()

    await click("Quote")
    await waitFor(() => expect(lastValue(onChange).root.children[0].type).toBe("quote"))
    expect(screen.getByRole("button", { name: "Quote" })).toHaveAttribute("aria-pressed", "true")
    // A quote has no text style, so the select falls back to its placeholder.
    expect(screen.getByRole("combobox", { name: "Text style" })).toHaveTextContent("Text style")

    await click("Quote")
    await waitFor(() => expect(lastValue(onChange).root.children[0].type).toBe("paragraph"))
  })

  it.each([
    ["Bulleted list", "bullet"],
    ["Numbered list", "number"],
  ])("toggles a %s on and off", async (name, listType) => {
    const onChange = vi.fn()
    render(<RichTextEditor defaultValue={doc("Hello")} onChange={onChange} />)
    await selectAll()

    await click(name)
    await waitFor(() =>
      expect(lastValue(onChange).root.children[0]).toMatchObject({ listType, type: "list" }),
    )
    expect(screen.getByRole("button", { name })).toHaveAttribute("aria-pressed", "true")

    await click(name)
    await waitFor(() => expect(lastValue(onChange).root.children[0].type).toBe("paragraph"))
  })

  it("enables undo after a change and redo after an undo", async () => {
    render(<RichTextEditor defaultValue={doc("Hello")} />)
    expect(isDisabled("Undo")).toBe(true)

    await selectAll()
    await click("Bold")
    await waitFor(() => expect(isDisabled("Undo")).toBe(false))

    await click("Undo")
    await waitFor(() => expect(isDisabled("Redo")).toBe(false))
    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "false")

    await click("Redo")
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "true"),
    )
  })

  it("shows an alert and does not mount the editor for unsupported content", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    const upload = { relationTo: "media", type: "upload", value: "1", version: 3 }
    render(<RichTextEditor defaultValue={doc("Hi", upload)} />)

    expect(screen.getByRole("alert")).toHaveTextContent("cannot edit (upload)")
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it("shows an alert for content that is not rich text", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    render(<RichTextEditor defaultValue={{ root: null } as unknown as RichTextValue} />)

    expect(screen.getByRole("alert")).toHaveTextContent("it is not rich text")
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
    consoleError.mockRestore()
  })

  it("treats a root with no children as empty content", async () => {
    const empty = { root: { ...doc().root, children: [] } } as unknown as RichTextValue
    render(<RichTextEditor defaultValue={empty} placeholder="Write here" />)

    expect(await screen.findByText("Write here")).toBeInTheDocument()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("shows a fallback when Lexical cannot load the content", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    // The node types are supported, but a text node cannot be a child of the root.
    const invalid = { root: { ...doc().root, children: [text("Hi")] } } as unknown as RichTextValue
    render(<RichTextEditor defaultValue={invalid} />)

    expect(screen.getByRole("alert")).toHaveTextContent("The editor could not load")
    expect(consoleError).toHaveBeenCalledWith(
      "RichTextEditor: the editor failed",
      expect.anything(),
    )
    consoleError.mockRestore()
  })

  it("locks the editor and toolbar while disabled", async () => {
    const { rerender } = render(<RichTextEditor defaultValue={doc("Hello")} disabled />)
    expect(screen.getByRole("textbox")).toHaveAttribute("contenteditable", "false")
    for (const button of screen.getAllByRole("button")) {
      expect(button).toHaveAttribute("aria-disabled", "true")
    }
    expect(screen.getByRole("combobox", { name: "Text style" })).toHaveAttribute(
      "aria-disabled",
      "true",
    )

    rerender(<RichTextEditor defaultValue={doc("Hello")} />)
    await waitFor(() =>
      expect(screen.getByRole("textbox")).toHaveAttribute("contenteditable", "true"),
    )
    expect(isDisabled("Bold")).toBe(false)
  })
})
