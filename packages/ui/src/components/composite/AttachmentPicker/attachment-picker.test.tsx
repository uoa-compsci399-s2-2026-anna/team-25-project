import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { AttachmentPicker } from "./attachment-picker"

const pdf = (name: string, size = 2048) =>
  new File(["x".repeat(size)], name, { lastModified: 1, type: "application/pdf" })

const fileInput = () => document.querySelector('input[type="file"]') as HTMLInputElement

describe("AttachmentPicker", () => {
  afterEach(() => {
    cleanup()
  })

  it("lists each picked file with its size", () => {
    render(<AttachmentPicker files={[pdf("rubric.pdf", 1536)]} onFilesChange={vi.fn()} />)

    expect(screen.getByText("rubric.pdf")).toBeInTheDocument()
    expect(screen.getByText("1.5 KB")).toBeInTheDocument()
  })

  it("shows no list until a file is picked", () => {
    render(<AttachmentPicker files={[]} onFilesChange={vi.fn()} />)
    expect(screen.queryByRole("list")).not.toBeInTheDocument()
  })

  it("adds picked files to the ones already chosen, skipping repeats", async () => {
    const user = userEvent.setup()
    const onFilesChange = vi.fn()
    const rubric = pdf("rubric.pdf")
    render(<AttachmentPicker files={[rubric]} onFilesChange={onFilesChange} />)

    await user.upload(fileInput(), [pdf("rubric.pdf"), pdf("notes.pdf")])

    expect(onFilesChange).toHaveBeenCalledWith([
      rubric,
      expect.objectContaining({ name: "notes.pdf" }),
    ])
  })

  it("removes a file", async () => {
    const user = userEvent.setup()
    const onFilesChange = vi.fn()
    const [rubric, notes] = [pdf("rubric.pdf"), pdf("notes.pdf")]
    render(<AttachmentPicker files={[rubric, notes]} onFilesChange={onFilesChange} />)

    await user.click(screen.getByRole("button", { name: "Remove rubric.pdf" }))

    expect(onFilesChange).toHaveBeenCalledWith([notes])
  })

  it("opens the file picker from the Add files button", async () => {
    const user = userEvent.setup()
    const id = "attachments"
    render(<AttachmentPicker files={[]} id={id} onFilesChange={vi.fn()} />)
    const click = vi.spyOn(fileInput(), "click")

    await user.click(screen.getByRole("button", { name: "Add files" }))

    expect(click).toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Add files" })).toHaveAttribute("id", id)
  })

  it("passes the accepted types to the file input", () => {
    render(<AttachmentPicker accept="application/pdf" files={[]} onFilesChange={vi.fn()} />)
    expect(fileInput()).toHaveAttribute("accept", "application/pdf")
  })

  it("disables adding and removing", () => {
    render(<AttachmentPicker disabled files={[pdf("rubric.pdf")]} onFilesChange={vi.fn()} />)

    expect(screen.getByRole("button", { name: "Add files" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Remove rubric.pdf" })).toBeDisabled()
  })
})
