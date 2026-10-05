import { toast } from "@repo/ui/components/ui"
import { act, cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createResource } from "../actions/createResource"
import { AddResourceDialog } from "./AddResourceDialog"

vi.mock("../actions/createResource", () => ({ createResource: vi.fn() }))
// Lexical can't be typed into under jsdom, so a textarea stands in and hands the form the
// same rich-text value the editor would.
vi.mock("@repo/ui/components/composite", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@repo/ui/components/composite")>()),
  RichTextEditor: ({
    onBlur,
    onChange,
  }: {
    onBlur?: () => void
    onChange: (value: unknown) => void
  }) => (
    <textarea
      aria-label="Description"
      onBlur={onBlur}
      onChange={(event) =>
        onChange({
          root: {
            type: "root",
            children: [
              {
                type: "paragraph",
                version: 1,
                children: [{ type: "text", version: 1, text: event.target.value }],
              },
            ],
            direction: null,
            format: "",
            indent: 0,
            version: 1,
          },
        })
      }
    />
  ),
}))

const courses = [{ label: "COMPSCI 399 - University of Auckland", value: 9 }]

const openDialog = async (options = courses) => {
  const user = userEvent.setup()
  render(<AddResourceDialog courses={options} />)
  await user.click(screen.getByRole("button", { name: "+ Contribute a resource" }))
  return user
}

const fillRequired = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText(/^Title/), "Contribution rubric")
  await user.type(screen.getByLabelText("Description"), "Four-criterion rubric.")
}

const sentForm = () => vi.mocked(createResource).mock.calls[0]?.[0] as FormData

describe("AddResourceDialog", () => {
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

  it("opens the form from the trigger button", async () => {
    await openDialog()
    expect(screen.getByRole("dialog", { name: "Contribute a resource" })).toBeInTheDocument()
  })

  it("sends the title, description, course and attachments, then closes", async () => {
    vi.mocked(createResource).mockResolvedValue({ ok: true })
    const user = await openDialog()
    await fillRequired(user)

    await user.click(screen.getByRole("combobox", { name: "Course" }))
    await user.click(await screen.findByRole("option", { name: courses[0].label }))
    const rubric = new File(["%PDF-1.4"], "rubric.pdf", { type: "application/pdf" })
    await user.upload(document.querySelector('input[type="file"]') as HTMLInputElement, rubric)

    await user.click(screen.getByRole("button", { name: "Share resource" }))

    await waitFor(() => expect(createResource).toHaveBeenCalledOnce())
    const sent = sentForm()
    expect(sent.get("title")).toBe("Contribution rubric")
    expect(sent.get("course")).toBe("9")
    expect(JSON.parse(sent.get("description") as string).root.children[0].children[0].text).toBe(
      "Four-criterion rubric.",
    )
    expect(sent.getAll("attachments")).toEqual([rubric])
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ title: "Resource shared" }))
  })

  it("sends no course when none is picked", async () => {
    vi.mocked(createResource).mockResolvedValue({ ok: true })
    const user = await openDialog()
    await fillRequired(user)

    await user.click(screen.getByRole("button", { name: "Share resource" }))

    await waitFor(() => expect(createResource).toHaveBeenCalledOnce())
    expect(sentForm().get("course")).toBe("")
  })

  it("asks for the required fields without sending", async () => {
    const user = await openDialog()

    await user.click(screen.getByRole("button", { name: "Share resource" }))

    expect(await screen.findByText("Title is required")).toBeInTheDocument()
    expect(screen.getByText("Description is required")).toBeInTheDocument()
    expect(createResource).not.toHaveBeenCalled()
  })

  it("refuses unsupported attachments without sending", async () => {
    const user = userEvent.setup({ applyAccept: false })
    render(<AddResourceDialog courses={courses} />)
    await user.click(screen.getByRole("button", { name: "+ Contribute a resource" }))
    await fillRequired(user)
    await user.upload(
      document.querySelector('input[type="file"]') as HTMLInputElement,
      new File(["<p>"], "page.html", { type: "text/html" }),
    )

    await user.click(screen.getByRole("button", { name: "Share resource" }))

    expect(await screen.findByText(/page\.html isn't a supported file type/)).toBeInTheDocument()
    expect(createResource).not.toHaveBeenCalled()
  })

  it("shows the server's field and form errors and stays open", async () => {
    vi.mocked(createResource).mockResolvedValue({
      fieldErrors: { attachments: "fake.pdf: Invalid PDF file." },
      formError: "Could not share this resource. Try again.",
      ok: false,
    })
    const user = await openDialog()
    await fillRequired(user)

    await user.click(screen.getByRole("button", { name: "Share resource" }))

    expect(await screen.findByText("fake.pdf: Invalid PDF file.")).toBeInTheDocument()
    expect(screen.getByText("Could not share this resource. Try again.")).toBeInTheDocument()
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("explains why the course picker is empty for a member with no courses", async () => {
    await openDialog([])

    expect(screen.getByRole("combobox", { name: "Course" })).toBeDisabled()
    expect(screen.getByText("You can link a course once you own or edit one.")).toBeInTheDocument()
  })
})
