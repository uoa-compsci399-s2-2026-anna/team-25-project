import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createPublication } from "../actions/createPublication"
import { AddPublicationForm } from "./AddPublicationForm"

vi.mock("../actions/createPublication", () => ({ createPublication: vi.fn() }))

const renderForm = () => {
  const onSuccess = vi.fn()
  render(<AddPublicationForm defaultAuthorName="Anna Smith" onSuccess={onSuccess} />)
  return { onSuccess, user: userEvent.setup() }
}

const submit = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Add publication" }))

describe("AddPublicationForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it("shows the signed-in member as a reorderable first author", () => {
    renderForm()

    const self = screen.getByRole("textbox", { name: "Author 1 name" })
    expect(self).toHaveValue("Anna Smith")
    expect(self).toBeDisabled()
    expect(screen.getByRole("button", { name: "Reorder author 1" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Remove author 1" })).not.toBeInTheDocument()
  })

  it("moves an author with the keyboard", async () => {
    const { user } = renderForm()
    await user.click(screen.getByRole("button", { name: "+ Add author" }))
    await user.type(screen.getByRole("textbox", { name: "Author 2 name" }), "Ben Lee")

    // jsdom lays nothing out, so give the list and each row a size and position
    // for the keyboard sensor and the restrict-to-list modifier.
    const handles = screen.getAllByRole("button", { name: /^Reorder/ })
    for (const [index, handle] of handles.entries()) {
      const row = handle.parentElement as HTMLElement
      vi.spyOn(row, "getBoundingClientRect").mockReturnValue(
        DOMRect.fromRect({ height: 40, width: 300, x: 0, y: index * 50 }),
      )
    }
    const list = handles[0]?.parentElement?.parentElement as HTMLElement
    vi.spyOn(list, "getBoundingClientRect").mockReturnValue(
      DOMRect.fromRect({ height: handles.length * 50, width: 300, x: 0, y: 0 }),
    )

    screen.getByRole("button", { name: "Reorder author 1" }).focus()
    await user.keyboard(" ")
    await user.keyboard("{ArrowDown}")
    await user.keyboard(" ")

    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "Author 2 name" })).toHaveValue("Anna Smith"),
    )
    expect(screen.getByRole("textbox", { name: "Author 1 name" })).toHaveValue("Ben Lee")
  })

  it("shows required errors and does not call the action", async () => {
    const { user } = renderForm()

    await user.click(screen.getByRole("button", { name: "+ Add author" }))
    await submit(user)

    expect(await screen.findByText("Title is required")).toBeInTheDocument()
    expect(screen.getByText("Author name is required")).toBeInTheDocument()
    expect(createPublication).not.toHaveBeenCalled()
  })

  it("adds and removes co-author rows", async () => {
    const { user } = renderForm()

    await user.click(screen.getByRole("button", { name: "+ Add author" }))
    await user.click(screen.getByRole("button", { name: "+ Add author" }))
    await user.type(screen.getByRole("textbox", { name: "Author 3 name" }), "Cara Ngata")
    await user.click(screen.getByRole("button", { name: "Remove author 2" }))

    expect(screen.queryByRole("textbox", { name: "Author 3 name" })).not.toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Author 2 name" })).toHaveValue("Cara Ngata")
  })

  it("submits the values and closes on success", async () => {
    vi.mocked(createPublication).mockResolvedValue({ ok: true })
    const { onSuccess, user } = renderForm()

    await user.type(screen.getByLabelText(/Title/), "Teamwork in capstones")
    await user.click(screen.getByRole("button", { name: "+ Add author" }))
    await user.type(screen.getByRole("textbox", { name: "Author 2 name" }), "Ben Lee")
    await user.type(screen.getByLabelText("Tags"), "Teamwork, Assessment")
    await submit(user)

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(createPublication).toHaveBeenCalledWith(
      expect.objectContaining({
        authors: [
          { id: expect.any(String), kind: "self" },
          { id: expect.any(String), kind: "coAuthor", name: "Ben Lee" },
        ],
        tags: "Teamwork, Assessment",
        title: "Teamwork in capstones",
        type: "article",
      }),
    )
  })

  it("shows server field and form errors", async () => {
    vi.mocked(createPublication).mockResolvedValue({
      fieldErrors: { authors: "Link yourself as one of the authors.", doi: "Value must be unique" },
      formError: "Could not add this publication. Try again.",
      ok: false,
    })
    const { onSuccess, user } = renderForm()

    await user.type(screen.getByLabelText(/Title/), "Teamwork in capstones")
    await submit(user)

    expect(await screen.findByText("Value must be unique")).toBeInTheDocument()
    expect(screen.getByText("Link yourself as one of the authors.")).toBeInTheDocument()
    expect(screen.getByText("Could not add this publication. Try again.")).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
