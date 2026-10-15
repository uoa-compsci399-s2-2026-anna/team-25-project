import type { RichTextValue } from "@repo/ui/components/composite"
import { act, cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { EditButton } from "./EditButton"
import { EditProvider } from "./EditContext"
import { EditRichText } from "./EditRichText"

// Cast as in the editor's own tests: Lexical's base node type doesn't list `children`.
const doc = (text: string) =>
  ({
    root: {
      type: "root",
      children: [
        {
          type: "paragraph",
          version: 1,
          children: [
            { type: "text", version: 1, text, detail: 0, format: 0, mode: "normal", style: "" },
          ],
          direction: "ltr",
          format: "",
          indent: 0,
          textFormat: 0,
          textStyle: "",
        },
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      version: 1,
    },
  }) as unknown as RichTextValue

const renderEditable = (onSave = vi.fn().mockResolvedValue({ ok: true })) => {
  render(
    <EditProvider onSave={onSave} validate={() => undefined}>
      <EditRichText label="Body" name="body" value={doc("Saved text")} view={<p>The view</p>} />
      <EditButton />
    </EditProvider>,
  )
  return onSave
}

// jsdom can't type into contenteditable, so the editor's state is replaced directly -
// Lexical keeps the editor instance on its root element.
const replaceText = (text: string) =>
  act(async () => {
    const root = screen.getByRole("textbox", { name: "Body" }) as HTMLElement & {
      __lexicalEditor: {
        parseEditorState: (json: string) => unknown
        setEditorState: (state: unknown) => void
      }
    }
    const editor = root.__lexicalEditor
    editor.setEditorState(editor.parseEditorState(JSON.stringify(doc(text))))
  })

describe("EditRichText", () => {
  afterEach(() => {
    cleanup()
  })

  it("shows the view until editing, then an editor named by its label", async () => {
    const user = userEvent.setup()
    renderEditable()
    expect(screen.getByText("The view")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Edit" }))

    expect(screen.queryByText("The view")).not.toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Body" })).toBeInTheDocument()
    expect(await screen.findByText("Saved text")).toBeInTheDocument()
  })

  it("sends the saved value back when nothing was changed", async () => {
    const user = userEvent.setup()
    const onSave = renderEditable()

    await user.click(screen.getByRole("button", { name: "Edit" }))
    await user.click(screen.getByRole("button", { name: "Done" }))

    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ body: doc("Saved text") }))
  })

  it("sends the edited value", async () => {
    const user = userEvent.setup()
    const onSave = renderEditable()

    await user.click(screen.getByRole("button", { name: "Edit" }))
    await screen.findByText("Saved text")
    await replaceText("New text")
    await user.click(screen.getByRole("button", { name: "Done" }))

    await waitFor(() => expect(onSave).toHaveBeenCalled())
    const sent = onSave.mock.lastCall?.[0].body as RichTextValue
    expect(JSON.stringify(sent)).toContain("New text")
    expect(JSON.stringify(sent)).not.toContain("Saved text")
  })
})
