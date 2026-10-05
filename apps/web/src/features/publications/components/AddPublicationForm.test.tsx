import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createPublication } from "../actions/createPublication"
import { AddPublicationForm } from "./AddPublicationForm"

vi.mock("../actions/createPublication", () => ({ createPublication: vi.fn() }))

const renderForm = () => {
  const onSuccess = vi.fn()
  render(
    <AddPublicationForm
      currentUser={{ firstName: "Anna", lastName: "Smith" }}
      onSuccess={onSuccess}
    />,
  )
  return { onSuccess, user: userEvent.setup() }
}

const openManualEntry = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Manual entry" }))

const submit = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Add publication" }))

// jsdom lays nothing out, so give the list and each row a size and position for
// the keyboard sensor and the restrictToParentElement modifier. The handle sits in
// the row, and the row sits in the list.
const mockAuthorLayout = () => {
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
}

const moveFirstAuthorDown = async (user: ReturnType<typeof userEvent.setup>) => {
  mockAuthorLayout()
  screen.getByRole("button", { name: "Reorder author 1" }).focus()
  await user.keyboard(" ")
  await user.keyboard("{ArrowDown}")
  await user.keyboard(" ")
}

describe("AddPublicationForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it("opens with the BibTeX import and keeps manual entry collapsed", () => {
    renderForm()

    expect(screen.getByRole("textbox", { name: "Paste a BibTeX entry" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Manual entry" })).toHaveAttribute(
      "aria-expanded",
      "false",
    )
    expect(screen.queryByRole("textbox", { name: /Title/ })).not.toBeInTheDocument()
  })

  it("shows the signed-in member as a reorderable first author", async () => {
    const { user } = renderForm()
    await openManualEntry(user)

    const self = screen.getByRole("textbox", { name: "Author 1 name" })
    expect(self).toHaveValue("Anna Smith")
    expect(self).toBeDisabled()
    expect(screen.getByRole("button", { name: "Reorder author 1" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Remove author 1" })).not.toBeInTheDocument()
  })

  it("moves an author with the keyboard", async () => {
    const { user } = renderForm()
    await openManualEntry(user)
    await user.click(screen.getByRole("button", { name: "+ Add author" }))
    await user.type(screen.getByRole("textbox", { name: "Author 2 name" }), "Ben Lee")

    await moveFirstAuthorDown(user)

    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "Author 2 name" })).toHaveValue("Anna Smith"),
    )
    expect(screen.getByRole("textbox", { name: "Author 1 name" })).toHaveValue("Ben Lee")
  })

  it("submits the authors in their new order after a move", async () => {
    vi.mocked(createPublication).mockResolvedValue({ ok: true })
    const { onSuccess, user } = renderForm()
    await openManualEntry(user)
    await user.type(screen.getByLabelText(/Title/), "Teamwork in capstones")
    await user.click(screen.getByRole("button", { name: "+ Add author" }))
    await user.type(screen.getByRole("textbox", { name: "Author 2 name" }), "Ben Lee")

    await moveFirstAuthorDown(user)
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "Author 1 name" })).toHaveValue("Ben Lee"),
    )
    await submit(user)

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(vi.mocked(createPublication).mock.calls[0]?.[0]).toMatchObject({
      authors: [{ kind: "coAuthor", name: "Ben Lee" }, { kind: "self" }],
    })
  })

  it("says the year is required when the year is cleared", async () => {
    const { user } = renderForm()
    await openManualEntry(user)

    await user.clear(screen.getByLabelText(/Year/))
    await user.tab()

    expect(await screen.findByText("Year is required")).toBeInTheDocument()
  })

  it("opens manual entry to show required errors and does not call the action", async () => {
    const { user } = renderForm()

    await submit(user)

    expect(await screen.findByText("Title is required")).toBeVisible()
    expect(screen.getByRole("button", { name: "Manual entry" })).toHaveAttribute(
      "aria-expanded",
      "true",
    )

    await user.click(screen.getByRole("button", { name: "+ Add author" }))
    await submit(user)
    expect(screen.getByText("Author name is required")).toBeInTheDocument()
    expect(createPublication).not.toHaveBeenCalled()
  })

  it("adds and removes co-author rows", async () => {
    const { user } = renderForm()
    await openManualEntry(user)

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
    await openManualEntry(user)

    await user.type(screen.getByLabelText(/Title/), "Teamwork in capstones")
    await user.type(screen.getByLabelText("DOI"), "10.1145/3313831.3376518")
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

  it("fills the form from a BibTeX entry and submits it", async () => {
    vi.mocked(createPublication).mockResolvedValue({ ok: true })
    const { onSuccess, user } = renderForm()

    await user.click(screen.getByRole("textbox", { name: "Paste a BibTeX entry" }))
    await user.paste(
      `@inproceedings{lee2023teams,
        author = {Lee, Ben and Smith, Anna},
        title = {Teamwork in Capstones},
        booktitle = {Proceedings of ITiCSE},
        year = {2023}, month = jul,
        pages = {10--20},
        doi = {10.1145/1234567.7654321}
      }`,
    )

    expect(await screen.findByText(/Filled 9 fields from BibTeX/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Manual entry" })).toHaveAttribute(
      "aria-expanded",
      "true",
    )
    expect(screen.queryByRole("textbox", { name: "Paste a BibTeX entry" })).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Title/)).toHaveValue("Teamwork in Capstones")
    expect(screen.getByLabelText(/Year/)).toHaveValue(2023)
    expect(screen.getByLabelText("Venue")).toHaveValue("Proceedings of ITiCSE")
    expect(screen.getByLabelText("Pages")).toHaveValue("10-20")
    expect(screen.getByLabelText("Citation key")).toHaveValue("lee2023teams")
    expect(screen.getByRole("textbox", { name: "Author 1 name" })).toHaveValue("Ben Lee")
    const self = screen.getByRole("textbox", { name: "Author 2 name" })
    expect(self).toHaveValue("Anna Smith")
    expect(self).toBeDisabled()

    await submit(user)

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(createPublication).toHaveBeenCalledWith(
      expect.objectContaining({
        authors: [
          { id: expect.any(String), kind: "coAuthor", name: "Ben Lee" },
          { id: expect.any(String), kind: "self" },
        ],
        doi: "10.1145/1234567.7654321",
        month: "7",
        title: "Teamwork in Capstones",
        type: "inproceedings",
        year: 2023,
      }),
    )
  })

  it("adds the member and warns when they are not in the imported authors", async () => {
    const { user } = renderForm()

    await user.click(screen.getByRole("textbox", { name: "Paste a BibTeX entry" }))
    await user.paste("@article{k, title={T}, author={Ben Lee}, doi={not-a-doi}}")

    expect(await screen.findByText(/You must be an author of the publication/)).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Author 1 name" })).toHaveValue("Anna Smith")
    expect(screen.getByRole("textbox", { name: "Author 2 name" })).toHaveValue("Ben Lee")
    // The imported DOI is validated the same as a typed one.
    expect(screen.getByText("Enter a DOI that starts with 10.")).toBeInTheDocument()
  })

  it("shows server field and form errors", async () => {
    vi.mocked(createPublication).mockResolvedValue({
      fieldErrors: { authors: "Link yourself as one of the authors.", doi: "Value must be unique" },
      formError: "Could not add this publication. Try again.",
      ok: false,
    })
    const { onSuccess, user } = renderForm()
    await openManualEntry(user)

    await user.type(screen.getByLabelText(/Title/), "Teamwork in capstones")
    await user.type(screen.getByLabelText("DOI"), "10.1145/3313831.3376518")
    await submit(user)

    expect(await screen.findByText("Value must be unique")).toBeInTheDocument()
    expect(screen.getByText("Link yourself as one of the authors.")).toBeInTheDocument()
    expect(screen.getByText("Could not add this publication. Try again.")).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it("shows a form error and does not close when the action throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.mocked(createPublication).mockRejectedValue(new Error("network"))
    const { onSuccess, user } = renderForm()
    await openManualEntry(user)

    await user.type(screen.getByLabelText(/Title/), "Teamwork in capstones")
    await submit(user)

    expect(
      await screen.findByText("Could not add this publication. Try again."),
    ).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it("shows a server error for a field the form does not have as a form error", async () => {
    vi.mocked(createPublication).mockResolvedValue({
      fieldErrors: { "authors.0.member": "This member does not exist." },
      ok: false,
    })
    const { user } = renderForm()
    await openManualEntry(user)

    await user.type(screen.getByLabelText(/Title/), "Teamwork in capstones")
    await submit(user)

    expect(await screen.findByText("This member does not exist.")).toBeInTheDocument()
  })

  it("clears author server errors when an author is removed", async () => {
    vi.mocked(createPublication).mockResolvedValue({
      fieldErrors: { "authors.2.name": "This name is too long." },
      ok: false,
    })
    const { user } = renderForm()
    await openManualEntry(user)
    await user.type(screen.getByLabelText(/Title/), "Teamwork in capstones")
    for (const name of ["Ben Lee", "Cara Ngata", "Dan Park"]) {
      await user.click(screen.getByRole("button", { name: "+ Add author" }))
      const rows = screen.getAllByRole("textbox", { name: /^Author \d+ name$/ })
      await user.type(rows[rows.length - 1] as HTMLElement, name)
    }
    await submit(user)
    expect(await screen.findByText("This name is too long.")).toBeInTheDocument()

    // Dan moves into the row the error was keyed to.
    await user.click(screen.getByRole("button", { name: "Remove author 2" }))

    expect(screen.getByRole("textbox", { name: "Author 3 name" })).toHaveValue("Dan Park")
    expect(screen.queryByText("This name is too long.")).not.toBeInTheDocument()
  })
})
