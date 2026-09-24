import {
  $createTableSelectionFrom,
  $isTableCellNode,
  $isTableNode,
  type TableCellNode,
  type TableRowNode,
} from "@lexical/table"
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  $createParagraphNode,
  $createRangeSelection,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  IS_BOLD,
  IS_ITALIC,
  IS_UNDERLINE,
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

const element = { direction: "ltr", format: "", indent: 0, version: 1 }

const cell = (content: string | Record<string, unknown>, extra: Record<string, unknown> = {}) => ({
  ...element,
  backgroundColor: null,
  children: [
    typeof content === "string"
      ? { ...element, children: [text(content)], textFormat: 0, textStyle: "", type: "paragraph" }
      : content,
  ],
  colSpan: 1,
  headerState: 0,
  rowSpan: 1,
  type: "tablecell",
  ...extra,
})

const tableDoc = (rows: Array<Array<ReturnType<typeof cell>>>) =>
  ({
    root: {
      ...element,
      children: [
        {
          ...element,
          children: rows.map((cells) => ({ ...element, children: cells, type: "tablerow" })),
          type: "table",
        },
      ],
      type: "root",
    },
  }) as unknown as RichTextValue

// A 2x2 table with a header row.
const grid = () =>
  tableDoc([
    [cell("A", { headerState: 1 }), cell("B", { headerState: 1 })],
    [cell("C"), cell("D")],
  ])

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

// Puts the cursor at the end of the given cell's first block.
const selectCell = (row: number, column: number) =>
  act(async () => {
    getEditor().update(() => {
      const table = $getRoot().getChildren().find($isTableNode)
      const cellNode = (table?.getChildAtIndex(row) as TableRowNode | null)?.getChildAtIndex(
        column,
      ) as TableCellNode | null
      const block = cellNode?.getFirstChild()
      if (!$isElementNode(block)) throw new Error(`no cell at ${row},${column}`)
      const last = block.getLastChild()
      if ($isTextNode(last)) last.select(last.getTextContentSize(), last.getTextContentSize())
      else block.select(0, 0)
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
      "Insert table",
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

  // The node types are supported, but a text node cannot be a child of the root.
  const unparsable = () =>
    ({ root: { ...doc().root, children: [text("Hi")] } }) as unknown as RichTextValue

  it.each(["test", "production"])(
    "shows an alert when Lexical cannot parse the content (NODE_ENV=%s)",
    (env) => {
      // In production Lexical only logs a parse error and loads part of the tree.
      vi.stubEnv("NODE_ENV", env)
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
      render(<RichTextEditor defaultValue={unparsable()} />)

      expect(screen.getByRole("alert")).toHaveTextContent("the editor cannot read it")
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
      expect(consoleError).toHaveBeenCalled()
      consoleError.mockRestore()
      vi.unstubAllEnvs()
    },
  )

  it("treats a null defaultValue as empty content", async () => {
    render(<RichTextEditor defaultValue={null} placeholder="Write here" />)

    expect(await screen.findByText("Write here")).toBeInTheDocument()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("ignores defaultValue changes after mount", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    const { rerender } = render(<RichTextEditor defaultValue={doc("Hello")} />)
    await screen.findByText("Hello")

    rerender(<RichTextEditor defaultValue={unparsable()} />)
    expect(screen.getByText("Hello")).toBeInTheDocument()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(consoleError).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it("saves every supported node unchanged, apart from the edit", async () => {
    const block = (type: string, children: unknown[], extra: Record<string, unknown> = {}) => ({
      ...element,
      children,
      type,
      ...extra,
    })
    // Lexical stores the format of a paragraph's first text as textFormat.
    const paragraph = (...children: Array<Record<string, unknown>>) =>
      block("paragraph", children, { textFormat: children[0]?.format ?? 0, textStyle: "" })
    const styled = (value: string, format: number) => ({ ...text(value), format })
    const item = (value: number, ...children: unknown[]) => block("listitem", children, { value })
    const nestedItem = (value: number, ...children: unknown[]) => ({
      ...item(value, ...children),
      indent: 1,
    })
    const list = (listType: "bullet" | "number", ...items: unknown[]) =>
      block("list", items, { listType, start: 1, tag: listType === "bullet" ? "ul" : "ol" })

    const saved = {
      root: block("root", [
        paragraph(text("Edit me")),
        ...(["h1", "h2", "h3", "h4", "h5", "h6"] as const).map((tag) =>
          block("heading", [text(tag)], { tag }),
        ),
        block("quote", [text("Quote")]),
        paragraph(
          styled("bold", IS_BOLD),
          styled("italic", IS_ITALIC),
          styled("underline", IS_UNDERLINE),
          styled("all", IS_BOLD | IS_ITALIC | IS_UNDERLINE),
          { type: "linebreak", version: 1 },
          { ...text("\t"), detail: 2, type: "tab" },
          text("after"),
        ),
        list(
          "bullet",
          item(1, text("One")),
          item(2, list("bullet", nestedItem(1, text("Nested")))),
        ),
        list("number", item(1, text("First")), item(2, text("Second"))),
        tableDoc([
          [cell("H1", { headerState: 3 }), cell("H2", { headerState: 1 })],
          [cell("R", { headerState: 2 }), cell("D")],
        ]).root.children[0],
      ]),
    } as unknown as RichTextValue

    const onChange = vi.fn()
    render(<RichTextEditor defaultValue={saved} onChange={onChange} />)
    await screen.findByText("Edit me")
    await act(async () => {
      getEditor().update(() => {
        const first = $getRoot().getFirstDescendant()
        if ($isTextNode(first)) first.setTextContent("Edited")
      })
    })

    await waitFor(() => expect(onChange).toHaveBeenCalled())
    const expected = structuredClone(saved) as unknown as {
      root: { children: Array<{ children: Array<{ text: string }> }> }
    }
    const firstText = expected.root.children[0]?.children[0]
    if (firstText) firstText.text = "Edited"
    expect(lastValue(onChange)).toEqual(expected)
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

  describe("tables", () => {
    type Node = Record<string, unknown> & { children?: Node[]; type: string }
    const tableIn = (onChange: ReturnType<typeof vi.fn>) =>
      (lastValue(onChange).root.children as Node[]).find((node) => node.type === "table")
    const shape = (table: Node | undefined) =>
      table?.children?.map((row) => row.children?.length ?? 0) ?? []

    it("inserts a 3x3 table with a header row", async () => {
      const onChange = vi.fn()
      render(<RichTextEditor defaultValue={doc("Hello")} onChange={onChange} />)
      await act(async () => {
        getEditor().update(() => $getRoot().selectEnd())
      })
      await click("Insert table")

      await waitFor(() => expect(shape(tableIn(onChange))).toEqual([3, 3, 3]))
      const [header, body] = tableIn(onChange)?.children ?? []
      expect(header?.children?.map((c) => c.headerState)).toEqual([1, 1, 1])
      expect(body?.children?.map((c) => c.headerState)).toEqual([0, 0, 0])
    })

    it("shows the table actions only while the cursor is in a table", async () => {
      render(<RichTextEditor defaultValue={grid()} />)
      await screen.findByText("A")
      expect(screen.queryByRole("button", { name: "Add row" })).not.toBeInTheDocument()

      await selectCell(1, 1)
      for (const name of ["Add row", "Add column", "Delete row", "Delete column", "Delete table"]) {
        expect(await screen.findByRole("button", { name })).toBeInTheDocument()
      }
      // Lexical does not support nested tables.
      expect(isDisabled("Insert table")).toBe(true)
    })

    it.each([
      ["Add row", [2, 2, 2]],
      ["Add column", [3, 3]],
      ["Delete row", [2]],
      ["Delete column", [1, 1]],
    ])("%s changes the table shape", async (name, expected) => {
      const onChange = vi.fn()
      render(<RichTextEditor defaultValue={grid()} onChange={onChange} />)
      await screen.findByText("A")
      await selectCell(1, 1)
      await click(name)

      await waitFor(() => expect(shape(tableIn(onChange))).toEqual(expected))
    })

    it("deletes the table", async () => {
      const onChange = vi.fn()
      render(<RichTextEditor defaultValue={grid()} onChange={onChange} />)
      await screen.findByText("A")
      await selectCell(0, 0)
      await click("Delete table")

      await waitFor(() => expect(onChange).toHaveBeenCalled())
      expect(tableIn(onChange)).toBeUndefined()
      expect(screen.queryByRole("button", { name: "Delete table" })).not.toBeInTheDocument()
    })

    // Selects every cell, as a drag across the table does.
    const selectAllCells = () =>
      act(async () => {
        getEditor().update(() => {
          const table = $getRoot().getChildren().find($isTableNode)
          const first = table?.getFirstDescendant()?.getParents().find($isTableCellNode)
          const last = table?.getLastDescendant()?.getParents().find($isTableCellNode)
          if (!table || !first || !last) throw new Error("no table")
          $setSelection($createTableSelectionFrom(table, first, last))
        })
      })

    it("highlights the selected cells", async () => {
      render(<RichTextEditor defaultValue={grid()} />)
      await screen.findByText("A")
      await selectCell(0, 0)
      await selectAllCells()

      await waitFor(() =>
        expect(screen.getByRole("columnheader", { name: "A" })).toHaveClass("bg-brand-charcoal/10"),
      )
      expect(screen.getByRole("cell", { name: "D" })).toHaveClass("bg-brand-charcoal/10")
    })

    it("deletes the table while several cells are selected", async () => {
      const onChange = vi.fn()
      render(<RichTextEditor defaultValue={grid()} onChange={onChange} />)
      await screen.findByText("A")
      await selectCell(0, 0)
      await selectAllCells()
      await click("Delete table")

      await waitFor(() => expect(onChange).toHaveBeenCalled())
      expect(tableIn(onChange)).toBeUndefined()
    })

    it("keeps merged cells from the Payload admin", async () => {
      const onChange = vi.fn()
      const merged = tableDoc([
        [cell("Wide", { colSpan: 2, headerState: 1 })],
        [cell("C"), cell("D")],
      ])
      render(<RichTextEditor defaultValue={merged} onChange={onChange} />)
      await screen.findByText("Wide")
      expect(screen.queryByRole("alert")).not.toBeInTheDocument()

      await selectCell(1, 0)
      await act(async () => {
        getEditor().update(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) selection.insertText("!")
        })
      })
      await waitFor(() => expect(onChange).toHaveBeenCalled())
      expect(tableIn(onChange)?.children?.[0]?.children?.[0]?.colSpan).toBe(2)
    })

    it("shows the text style of a heading inside a cell", async () => {
      const heading = { ...element, children: [text("Title")], tag: "h3", type: "heading" }
      render(<RichTextEditor defaultValue={tableDoc([[cell(heading), cell("B")]])} />)
      await screen.findByText("Title")
      await selectCell(0, 0)

      await waitFor(() =>
        expect(screen.getByRole("combobox", { name: "Text style" })).toHaveTextContent("Heading 3"),
      )
    })
  })
})
