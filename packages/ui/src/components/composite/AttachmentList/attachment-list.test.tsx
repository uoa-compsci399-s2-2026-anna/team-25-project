import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { AttachmentList, type AttachmentListItem } from "./attachment-list"

const rubric: AttachmentListItem = {
  href: "/files/rubric.pdf",
  id: 1,
  name: "rubric.pdf",
  size: 2_516_582,
  type: "PDF",
}

describe("AttachmentList", () => {
  afterEach(() => {
    cleanup()
  })

  it("names each attachment with its type and size", () => {
    render(<AttachmentList attachments={[rubric]} />)

    expect(screen.getByText("rubric.pdf")).toBeInTheDocument()
    expect(screen.getByText("PDF - 2.4 MB")).toBeInTheDocument()
  })

  it.each([
    [512, "512 B"],
    [1536, "1.5 KB"],
    [5 * 1024 ** 3, "5.0 GB"],
  ])("formats %i bytes as %s", (size, label) => {
    render(<AttachmentList attachments={[{ ...rubric, size, type: undefined }]} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it("leaves the details line out when there is no type or size", () => {
    render(
      <AttachmentList attachments={[{ href: "/files/notes.txt", id: 2, name: "notes.txt" }]} />,
    )
    expect(screen.getByRole("listitem")).toHaveTextContent(/^notes\.txtDownload$/)
  })

  it("downloads each file under its own name", () => {
    render(<AttachmentList attachments={[rubric]} />)

    const link = screen.getByRole("button", { name: "Download rubric.pdf" })
    expect(link).toHaveAttribute("href", "/files/rubric.pdf")
    expect(link).toHaveAttribute("download", "rubric.pdf")
  })

  it("renders one row per attachment", () => {
    render(
      <AttachmentList
        attachments={[rubric, { href: "/files/survey.csv", id: 2, name: "survey.csv" }]}
      />,
    )
    expect(screen.getAllByRole("listitem")).toHaveLength(2)
  })
})
