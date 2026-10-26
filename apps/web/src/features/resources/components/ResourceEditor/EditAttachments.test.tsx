import type { AttachmentListItem } from "@repo/ui/components/composite"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { EditButton } from "@/components/Editor/EditButton"
import { updateResource } from "../../actions/updateResource"
import { ResourceEditProvider } from "./ResourceEditProvider"
import { ResourceEdit } from "./resourceEditFields"

vi.mock("../../actions/updateResource", () => ({ updateResource: vi.fn() }))

const saved = (id: number, name: string): AttachmentListItem => ({
  href: `/payload/api/resourceAttachments/file/${name}`,
  id,
  name,
  size: 2048,
  type: "PDF",
})

const pdf = (name: string) => new File(["%PDF-1.4"], name, { type: "application/pdf" })

const fileInput = () => document.querySelector('input[type="file"]') as HTMLInputElement

const renderEditor = (existing = [saved(4, "rubric.pdf"), saved(5, "notes.pdf")]) =>
  render(
    <ResourceEditProvider resourceId={3}>
      <ResourceEdit.Attachments
        existing={existing}
        label="Attachments"
        name="attachments"
        view={<span>Attachments view</span>}
      />
      <EditButton />
    </ResourceEditProvider>,
  )

const startEditing = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Edit" }))

describe("EditAttachments", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(updateResource).mockResolvedValue({ ok: true })
  })

  afterEach(() => {
    cleanup()
  })

  it("shows the view until editing starts", () => {
    renderEditor()

    expect(screen.getByText("Attachments view")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Add files/ })).not.toBeInTheDocument()
  })

  it("saves every file as kept when nothing changes", async () => {
    const user = userEvent.setup()
    renderEditor()

    await startEditing(user)
    await user.click(screen.getByRole("button", { name: "Done" }))

    expect(updateResource).toHaveBeenCalledWith(3, { attachments: { add: [], keep: [4, 5] } })
  })

  it("unlinks a removed file", async () => {
    const user = userEvent.setup()
    renderEditor()

    await startEditing(user)
    await user.click(screen.getByRole("button", { name: "Remove rubric.pdf" }))
    expect(screen.queryByText("rubric.pdf")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Done" }))

    expect(updateResource).toHaveBeenCalledWith(3, { attachments: { add: [], keep: [5] } })
  })

  it("sends a newly picked file to upload", async () => {
    const user = userEvent.setup()
    renderEditor()
    const file = pdf("slides.pdf")

    await startEditing(user)
    await user.upload(fileInput(), file)
    expect(screen.getByText("slides.pdf")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Done" }))

    expect(updateResource).toHaveBeenCalledWith(3, {
      attachments: { add: [file], keep: [4, 5] },
    })
  })

  it("refuses more files than the cap, counting the saved ones, and saves nothing", async () => {
    const user = userEvent.setup()
    renderEditor(Array.from({ length: 10 }, (_, i) => saved(i + 1, `file-${i}.pdf`)))

    await startEditing(user)
    await user.upload(fileInput(), pdf("one-too-many.pdf"))
    await user.click(screen.getByRole("button", { name: "Done" }))

    expect(await screen.findByText("Attach at most 10 files.")).toBeInTheDocument()
    expect(updateResource).not.toHaveBeenCalled()
  })
})
