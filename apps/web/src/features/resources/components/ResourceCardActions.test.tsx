import type { RichTextValue } from "@repo/ui/components/composite"
import { toast } from "@repo/ui/components/ui"
import { act, cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { deleteResource } from "../actions/deleteResource"
import { updateResource } from "../actions/updateResource"
import { ResourceCardActions } from "./ResourceCardActions"

const refresh = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh }) }))
vi.mock("../actions/deleteResource", () => ({ deleteResource: vi.fn() }))
vi.mock("../actions/updateResource", () => ({ updateResource: vi.fn() }))
vi.mock("../actions/createResource", () => ({ createResource: vi.fn() }))
// Lexical can't be rendered under jsdom, so a stand-in shows the value it was given.
vi.mock("@repo/ui/components/composite", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@repo/ui/components/composite")>()),
  RichTextEditor: ({ defaultValue }: { defaultValue?: RichTextValue }) => (
    <div data-testid="description">{JSON.stringify(defaultValue)}</div>
  ),
}))

const description = {
  root: {
    type: "root",
    children: [
      {
        type: "paragraph",
        version: 1,
        children: [{ type: "text", version: 1, text: "Four-criterion rubric." }],
      },
    ],
    direction: null,
    format: "",
    indent: 0,
    version: 1,
  },
} as unknown as RichTextValue

const TITLE = "Individual contribution rubric"

const renderActions = () => {
  const user = userEvent.setup()
  render(
    <ResourceCardActions
      courses={[{ label: "COMPSCI 399 - University of Auckland", value: 9 }]}
      initialValues={{ course: 9, description, title: TITLE }}
      resourceId={3}
      savedAttachments={[
        { id: 21, name: "rubric.pdf", size: 1024 },
        { id: 22, name: "notes.pdf", size: 2048 },
      ]}
      title={TITLE}
    />,
  )
  return user
}

const openMenuItem = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(screen.getByRole("button", { name: `Actions for ${TITLE}` }))
  await user.click(await screen.findByRole("menuitem", { name }))
}

describe("ResourceCardActions", () => {
  beforeEach(() => {
    vi.spyOn(toast, "add")
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    act(() => {
      toast.close()
    })
  })

  it("opens the edit dialog, prefilled with the resource's saved values and files", async () => {
    const user = renderActions()
    await openMenuItem(user, "Edit")

    expect(screen.getByRole("dialog", { name: "Edit resource" })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Title/)).toHaveValue(TITLE)
    expect(screen.getByRole("combobox", { name: "Course" })).toHaveTextContent(
      "COMPSCI 399 - University of Auckland",
    )
    expect(screen.getByTestId("description")).toHaveTextContent("Four-criterion rubric.")
    expect(screen.getByText("rubric.pdf")).toBeInTheDocument()
    expect(screen.getByText("notes.pdf")).toBeInTheDocument()
  })

  it("saves with the files still listed, then closes and refreshes", async () => {
    vi.mocked(updateResource).mockResolvedValue({ ok: true })
    const user = renderActions()
    await openMenuItem(user, "Edit")

    await user.click(screen.getByRole("button", { name: "Remove rubric.pdf" }))
    const extra = new File(["%PDF-1.4"], "extra.pdf", { type: "application/pdf" })
    await user.upload(document.querySelector('input[type="file"]') as HTMLInputElement, extra)
    await user.clear(screen.getByLabelText(/^Title/))
    await user.type(screen.getByLabelText(/^Title/), "Updated rubric")
    await user.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() => expect(updateResource).toHaveBeenCalledOnce())
    const [id, sent] = vi.mocked(updateResource).mock.calls[0] as [number, FormData]
    expect(id).toBe(3)
    expect(sent.get("title")).toBe("Updated rubric")
    expect(sent.get("course")).toBe("9")
    expect(sent.getAll("keepAttachments")).toEqual(["22"])
    expect(sent.getAll("attachments")).toEqual([extra])
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ title: "Resource updated" }))
    expect(refresh).toHaveBeenCalledOnce()
  })

  it("keeps the dialog open with the server's error when the save fails", async () => {
    vi.mocked(updateResource).mockResolvedValue({
      formError: "Could not save this resource. Try again.",
      ok: false,
    })
    const user = renderActions()
    await openMenuItem(user, "Edit")

    await user.click(screen.getByRole("button", { name: "Save changes" }))

    expect(await screen.findByText("Could not save this resource. Try again.")).toBeInTheDocument()
    expect(screen.getByRole("dialog", { name: "Edit resource" })).toBeInTheDocument()
    expect(refresh).not.toHaveBeenCalled()
  })

  it("brings back a removed file when the edit is cancelled and reopened", async () => {
    const user = renderActions()
    await openMenuItem(user, "Edit")
    await user.click(screen.getByRole("button", { name: "Remove rubric.pdf" }))
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())

    await openMenuItem(user, "Edit")

    expect(screen.getByText("rubric.pdf")).toBeInTheDocument()
  })

  it("deletes and refreshes the list when Confirm delete succeeds", async () => {
    vi.mocked(deleteResource).mockResolvedValue({ ok: true })
    const user = renderActions()
    await openMenuItem(user, "Delete")
    await user.click(await screen.findByRole("button", { name: "Confirm delete" }))

    await waitFor(() => expect(deleteResource).toHaveBeenCalledWith(3))
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ title: "Resource deleted" }))
    expect(refresh).toHaveBeenCalledOnce()
  })

  it("shows the failure message and doesn't refresh when delete fails", async () => {
    vi.mocked(deleteResource).mockResolvedValue({
      formError: "Could not delete this resource. Try again.",
      ok: false,
    })
    const user = renderActions()
    await openMenuItem(user, "Delete")
    await user.click(await screen.findByRole("button", { name: "Confirm delete" }))

    await waitFor(() =>
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Could not delete this resource. Try again.",
          title: "Delete failed",
        }),
      ),
    )
    expect(refresh).not.toHaveBeenCalled()
  })

  it("shows the failure message and doesn't refresh when deleteResource throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.mocked(deleteResource).mockRejectedValue(new Error("network down"))
    const user = renderActions()
    await openMenuItem(user, "Delete")
    await user.click(await screen.findByRole("button", { name: "Confirm delete" }))

    await waitFor(() =>
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Could not delete this resource. Try again.",
          title: "Delete failed",
        }),
      ),
    )
    expect(refresh).not.toHaveBeenCalled()
  })
})
