import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { postProposal } from "../actions/postProposal"
import { PostProposalForm } from "./PostProposalForm"

vi.mock("../actions/postProposal", () => ({ postProposal: vi.fn() }))

// Lexical doesn't run in jsdom, so a textarea stands in for the body and writes the
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
      aria-label="Body"
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

const renderForm = () => {
  render(<PostProposalForm />)
  return userEvent.setup()
}

const fillRequired = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText(/^Title/), "Peer assessment")
  await user.type(screen.getByLabelText(/^Summary/), "A short summary.")
  await user.type(screen.getByRole("textbox", { name: "Body" }), "The proposal.")
}

const submit = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Publish proposal" }))

describe("PostProposalForm", () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("posts the picked tags and end year", async () => {
    vi.mocked(postProposal).mockResolvedValue({ ok: true })
    const user = renderForm()

    await fillRequired(user)
    await user.type(screen.getByLabelText("End year"), "2099")
    await user.click(screen.getByRole("checkbox", { name: "Teamwork" }))
    await user.click(screen.getByRole("checkbox", { name: "Assessment" }))
    await submit(user)

    await waitFor(() => expect(postProposal).toHaveBeenCalledOnce())
    expect(vi.mocked(postProposal).mock.calls[0]?.[0]).toMatchObject({
      tags: ["assessment", "teamwork"],
      timeframe: { endPeriod: null, endYear: 2099 },
    })
  })

  it("posts no end and no tags when they're left empty", async () => {
    vi.mocked(postProposal).mockResolvedValue({ ok: true })
    const user = renderForm()

    await fillRequired(user)
    await submit(user)

    await waitFor(() => expect(postProposal).toHaveBeenCalledOnce())
    expect(vi.mocked(postProposal).mock.calls[0]?.[0]).toMatchObject({
      tags: [],
      timeframe: { endPeriod: null },
    })
  })

  it("shows every required error when submitted empty", async () => {
    const user = renderForm()

    await submit(user)

    expect(await screen.findByText("Title is required")).toBeVisible()
    expect(screen.getByText("Summary is required")).toBeVisible()
    expect(screen.getByText("Body is required")).toBeVisible()
    expect(postProposal).not.toHaveBeenCalled()
  })

  it("posts once the fields are filled after an empty submit", async () => {
    vi.mocked(postProposal).mockResolvedValue({ ok: true })
    const user = renderForm()

    await submit(user)
    await screen.findByText("Body is required")
    await fillRequired(user)
    await submit(user)

    await waitFor(() => expect(postProposal).toHaveBeenCalledOnce())
  })

  it("refuses an end year before the start year", async () => {
    const user = renderForm()

    await fillRequired(user)
    await user.type(screen.getByLabelText("End year"), "2001")
    await submit(user)

    expect(await screen.findByText("End year cannot be before the start year.")).toBeVisible()
    expect(postProposal).not.toHaveBeenCalled()
  })
})
