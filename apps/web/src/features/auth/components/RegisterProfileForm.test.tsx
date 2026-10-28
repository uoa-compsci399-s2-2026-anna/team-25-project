import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { completeProfile } from "../actions/register"
import { RegisterProfileForm } from "./RegisterProfileForm"

vi.mock("../actions/register", () => ({ completeProfile: vi.fn() }))

const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })

const submit = () => fireEvent.click(screen.getByRole("button", { name: "Finish & enter CCCA" }))

describe("RegisterProfileForm", () => {
  beforeEach(() => {
    vi.mocked(completeProfile).mockReset().mockResolvedValue({ ok: true })
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
    const formData = vi.mocked(completeProfile).mock.calls[0]?.[0] as FormData
    expect(Object.fromEntries(formData)).toEqual({
      bio: "Teaches capstone.",
      department: "School of Computer Science",
      faculty: "Faculty of Science",
      links: "[]",
      researchInterests: "Code review",
      teachingInterests: "Capstone projects",
    })
  })

  it("shows an error from the server under its field", async () => {
    vi.mocked(completeProfile).mockResolvedValue({
      fieldErrors: { teachingInterests: "Add up to 10 teaching interests" },
      ok: false,
    })
    render(<RegisterProfileForm initials="AT" />)
    submit()

    expect(await screen.findByText("Add up to 10 teaching interests")).toBeInTheDocument()
  })
})
