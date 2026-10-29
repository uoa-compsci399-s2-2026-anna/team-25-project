import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { completeProfile } from "../actions/register"
import { RegisterProfileForm, RegisterProfileSkeleton } from "./RegisterProfileForm"

vi.mock("../actions/register", () => ({ completeProfile: vi.fn() }))

const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })

const pickPhoto = (container: HTMLElement, file: File) => {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]')
  if (!input) throw new Error("file input not found")
  fireEvent.change(input, { target: { files: [file] } })
}

const sentFormData = () => vi.mocked(completeProfile).mock.calls[0]?.[0] as FormData

const submit = () => fireEvent.click(screen.getByRole("button", { name: "Finish & enter CCCA" }))

describe("RegisterProfileForm", () => {
  beforeEach(() => {
    vi.mocked(completeProfile).mockReset().mockResolvedValue({ ok: true })
    // jsdom has no object URLs; AvatarUpload makes one for the preview.
    URL.createObjectURL = vi.fn(() => "blob:preview")
  })

  afterEach(() => {
    cleanup()
  })

  it("sends each profile field under the name completeProfile reads", async () => {
    render(<RegisterProfileForm initials="AT" />)
    type("Faculty", "Faculty of Science")
    type("Department", "School of Computer Science")
    type("About you", "Teaches capstone.")
    type("Research interests", "Code review")
    type("Teaching interests", "Capstone projects")
    submit()

    await waitFor(() => expect(completeProfile).toHaveBeenCalledTimes(1))
    expect(Object.fromEntries(sentFormData())).toEqual({
      bio: "Teaches capstone.",
      department: "School of Computer Science",
      faculty: "Faculty of Science",
      links: "[]",
      researchInterests: "Code review",
      teachingInterests: "Capstone projects",
    })
  })

  it.each(["faculty", "department", "bio", "researchInterests", "teachingInterests", "links"])(
    "shows a server error for %s",
    async (field) => {
      vi.mocked(completeProfile).mockResolvedValue({
        fieldErrors: { [field]: `Bad ${field}` },
        ok: false,
      })
      render(<RegisterProfileForm initials="AT" />)
      submit()

      expect(await screen.findByText(`Bad ${field}`)).toBeInTheDocument()
    },
  )

  it("sends links that were added, and leaves out a removed one", async () => {
    render(<RegisterProfileForm initials="AT" />)
    fireEvent.click(screen.getByRole("button", { name: "Add link" }))
    fireEvent.click(screen.getByRole("button", { name: "Add link" }))
    type("Link 1 label", "GitHub")
    type("Link 1 address", "https://github.com/anna")
    fireEvent.blur(screen.getByLabelText("Link 1 address"))
    fireEvent.click(screen.getByRole("button", { name: "Remove link 2" }))
    submit()

    await waitFor(() => expect(completeProfile).toHaveBeenCalledTimes(1))
    expect(JSON.parse(sentFormData().get("links") as string)).toEqual([
      { label: "GitHub", url: "https://github.com/anna" },
    ])
  })

  it("stops offering Add link once the limit is reached", () => {
    render(<RegisterProfileForm initials="AT" />)
    for (let i = 0; i < 5; i++) fireEvent.click(screen.getByRole("button", { name: "Add link" }))

    expect(screen.queryByRole("button", { name: "Add link" })).not.toBeInTheDocument()
  })

  it("checks the fields in the browser before sending", async () => {
    render(<RegisterProfileForm initials="AT" />)
    type("Faculty", "x".repeat(101))
    fireEvent.click(screen.getByRole("button", { name: "Add link" }))
    type("Link 1 address", "not a url")
    submit()

    expect(await screen.findByText("Keep your faculty under 100 characters")).toBeInTheDocument()
    expect(screen.getByText("Add a label")).toBeInTheDocument()
    expect(
      screen.getByText("Enter a full web address starting with http:// or https://"),
    ).toBeInTheDocument()
    expect(completeProfile).not.toHaveBeenCalled()
  })

  it("sends a picked photo and shows its name", async () => {
    const { container } = render(<RegisterProfileForm initials="AT" />)
    const photo = new File(["photo"], "me.png", { type: "image/png" })
    pickPhoto(container, photo)
    expect(screen.getByText("me.png")).toBeInTheDocument()
    submit()

    await waitFor(() => expect(completeProfile).toHaveBeenCalledTimes(1))
    expect(sentFormData().get("avatar")).toBeInstanceOf(File)
  })

  it("rejects a photo over 4 MB without sending", async () => {
    const { container } = render(<RegisterProfileForm initials="AT" />)
    pickPhoto(
      container,
      new File([new Uint8Array(4 * 1024 * 1024 + 1)], "big.png", { type: "image/png" }),
    )
    submit()

    expect(await screen.findByText("Your photo must be 4 MB or smaller.")).toBeInTheDocument()
    expect(completeProfile).not.toHaveBeenCalled()
  })

  it("shows a form error from the server", async () => {
    vi.mocked(completeProfile).mockResolvedValue({ formError: "Could not upload", ok: false })
    render(<RegisterProfileForm initials="AT" />)
    submit()

    expect(await screen.findByText("Could not upload")).toBeInTheDocument()
  })

  it("shows a generic error when the request itself fails", async () => {
    vi.mocked(completeProfile).mockRejectedValue(new Error("network"))
    render(<RegisterProfileForm initials="AT" />)
    submit()

    expect(await screen.findByText("Could not save your profile. Try again.")).toBeInTheDocument()
  })
})

describe("RegisterProfileSkeleton", () => {
  it("reserves a row for every field the form shows", () => {
    render(<RegisterProfileSkeleton />)
    for (const label of [
      "Faculty",
      "Department",
      "About you",
      "Research interests",
      "Teaching interests",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
    cleanup()
  })
})
