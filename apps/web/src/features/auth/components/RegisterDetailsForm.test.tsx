import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { useRouter } from "next/navigation"
import { withNuqsTestingAdapter } from "nuqs/adapters/testing"
import { Activity } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { registerMember, sendVerificationCode } from "../actions/register"
import { RegisterDetailsForm } from "./RegisterDetailsForm"

vi.mock("../actions/register", () => ({ registerMember: vi.fn(), sendVerificationCode: vi.fn() }))
vi.mock("next/navigation", () => ({ useRouter: vi.fn() }))
// The combobox has its own tests in @repo/ui; a plain select keeps these about the flow.
vi.mock("./InstitutionSelect", () => ({
  InstitutionSelect: ({
    id,
    onValueChange,
    value,
  }: {
    id: string
    onValueChange: (value: string) => void
    value: string
  }) => (
    <select id={id} onChange={(event) => onValueChange(event.target.value)} value={value}>
      <option value="">Select</option>
      <option value="1">Example University</option>
    </select>
  ),
}))

const institutions = [{ domains: ["example.ac.nz"], id: 1, name: "Example University" }]
const push = vi.fn()

const details = {
  agreedToTerms: true,
  email: "a.tui@example.ac.nz",
  firstName: "Anna",
  institution: "1",
  lastName: "Tui",
  password: "Password1!",
  position: "Senior Lecturer",
  title: null,
}

const renderForm = (searchParams: Record<string, string> = {}) =>
  render(<RegisterDetailsForm institutions={institutions} />, {
    wrapper: withNuqsTestingAdapter({ searchParams }),
  })

const fillDetails = () => {
  const type = (label: RegExp, value: string) =>
    fireEvent.change(screen.getByLabelText(label), { target: { value } })
  type(/^First name/, details.firstName)
  type(/^Surname/, details.lastName)
  type(/^University \/ Institution/, details.institution)
  type(/^Position/, details.position)
  type(/^University email/, details.email)
  type(/^Password/, details.password)
  fireEvent.click(screen.getByRole("checkbox"))
}

const continueToCode = async () => {
  fillDetails()
  fireEvent.click(screen.getByRole("button", { name: "Continue" }))
  return screen.findByLabelText("Verification code")
}

const verify = (code = "482913") => {
  fireEvent.change(screen.getByLabelText("Verification code"), { target: { value: code } })
  fireEvent.click(screen.getByRole("button", { name: "Verify & continue" }))
}

describe("RegisterDetailsForm", () => {
  beforeEach(() => {
    // biome-ignore lint/suspicious/noExplicitAny: minimal useRouter mock, only .push is used
    vi.mocked(useRouter).mockReturnValue({ push } as any)
    vi.mocked(sendVerificationCode).mockResolvedValue({ ok: true })
    vi.mocked(registerMember).mockResolvedValue({ ok: true })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("sends a code for the details and asks for it, without creating an account", async () => {
    renderForm()

    await continueToCode()

    expect(sendVerificationCode).toHaveBeenCalledWith(details)
    expect(screen.getByText(details.email)).toBeInTheDocument()
    expect(registerMember).not.toHaveBeenCalled()
  })

  it("keeps the member on the details when they can't be sent a code", async () => {
    vi.mocked(sendVerificationCode).mockResolvedValue({
      fieldErrors: { email: "A user with the given email is already registered." },
      ok: false,
    })
    renderForm()
    fillDetails()
    fireEvent.click(screen.getByRole("button", { name: "Continue" }))

    expect(
      await screen.findByText("A user with the given email is already registered."),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText("Verification code")).not.toBeInTheDocument()
  })

  it("creates the account with the details and code, then moves to the profile step", async () => {
    renderForm({ redirect: "/proposals" })
    await continueToCode()
    verify()

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/register/profile?redirect=%2Fproposals"),
    )
    expect(registerMember).toHaveBeenCalledWith({ ...details, code: "482913" })
  })

  // Next hides a page with Activity on navigation rather than unmounting it.
  it("starts fresh when shown again after signing up", async () => {
    const form = (mode: "hidden" | "visible") => (
      <Activity mode={mode}>
        <RegisterDetailsForm institutions={institutions} />
      </Activity>
    )
    const { rerender } = render(form("visible"), { wrapper: withNuqsTestingAdapter() })
    await continueToCode()
    verify()
    await waitFor(() => expect(push).toHaveBeenCalled())

    rerender(form("hidden"))
    rerender(form("visible"))

    expect(screen.queryByLabelText("Verification code")).not.toBeInTheDocument()
    expect(screen.getByLabelText(/^University email/)).toHaveValue("")
    expect(screen.getByLabelText(/^Password/)).toHaveValue("")
  })

  it("keeps the code step when shown again before signing up", async () => {
    const form = (mode: "hidden" | "visible") => (
      <Activity mode={mode}>
        <RegisterDetailsForm institutions={institutions} />
      </Activity>
    )
    const { rerender } = render(form("visible"), { wrapper: withNuqsTestingAdapter() })
    await continueToCode()

    rerender(form("hidden"))
    rerender(form("visible"))

    expect(screen.getByLabelText("Verification code")).toBeInTheDocument()
  })

  it("returns to the details, still filled in, when they were the problem", async () => {
    vi.mocked(registerMember).mockResolvedValue({
      fieldErrors: { email: "A user with the given email is already registered." },
      ok: false,
    })
    renderForm()
    await continueToCode()
    verify()

    expect(
      await screen.findByText("A user with the given email is already registered."),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/^University email/)).toHaveValue(details.email)
  })

  it("goes back to the details with everything still typed in", async () => {
    renderForm()
    await continueToCode()
    fireEvent.click(screen.getByRole("button", { name: "Change your details" }))

    expect(screen.getByLabelText(/^First name/)).toHaveValue(details.firstName)
    expect(screen.getByLabelText(/^University email/)).toHaveValue(details.email)
  })

  it("puts focus on the email rather than the top of the page when going back", async () => {
    renderForm()
    await continueToCode()
    fireEvent.click(screen.getByRole("button", { name: "Change your details" }))

    await waitFor(() => expect(screen.getByLabelText(/^University email/)).toHaveFocus())
  })

  it("returns to the details when a resend is refused because of them", async () => {
    renderForm()
    await continueToCode()
    // Come back to the same code with no wait left, so Resend is offered straight away.
    fireEvent.click(screen.getByRole("button", { name: "Change your details" }))
    vi.mocked(sendVerificationCode).mockResolvedValueOnce({
      formError: "You can ask for a new code in 1 second.",
      ok: false,
      retryAfterSeconds: 0,
    })
    fireEvent.click(screen.getByRole("button", { name: "Continue" }))
    await screen.findByLabelText("Verification code")

    vi.mocked(sendVerificationCode).mockResolvedValue({
      fieldErrors: { email: "A user with the given email is already registered." },
      ok: false,
    })
    fireEvent.click(screen.getByRole("button", { name: "Resend code" }))

    expect(
      await screen.findByText("A user with the given email is already registered."),
    ).toBeInTheDocument()
    await waitFor(() => expect(screen.getByLabelText(/^University email/)).toHaveFocus())
  })

  it("reuses the code just sent when the same address is resubmitted", async () => {
    renderForm()
    await continueToCode()
    fireEvent.click(screen.getByRole("button", { name: "Change your details" }))

    vi.mocked(sendVerificationCode).mockResolvedValue({
      formError: "You can ask for a new code in 50 seconds.",
      ok: false,
      retryAfterSeconds: 50,
    })
    fireEvent.click(screen.getByRole("button", { name: "Continue" }))

    expect(await screen.findByRole("button", { name: "Resend code in 50s" })).toBeDisabled()
  })

  it("explains a long wait when the hourly limit is reached", async () => {
    renderForm()
    await continueToCode()
    fireEvent.click(screen.getByRole("button", { name: "Change your details" }))

    vi.mocked(sendVerificationCode).mockResolvedValue({
      formError: "You can ask for a new code in 45 minutes.",
      ok: false,
      retryAfterSeconds: 2_700,
    })
    fireEvent.click(screen.getByRole("button", { name: "Continue" }))

    expect(await screen.findByText("You can ask for a new code in 45 minutes.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Resend code in 45:00" })).toBeDisabled()
  })

  it("goes to the code step for a code sent before the page was refreshed", async () => {
    vi.mocked(sendVerificationCode).mockResolvedValue({
      formError: "You can ask for a new code in 50 seconds.",
      ok: false,
      retryAfterSeconds: 50,
    })
    renderForm()
    fillDetails()
    fireEvent.click(screen.getByRole("button", { name: "Continue" }))

    expect(await screen.findByLabelText("Verification code")).toBeInTheDocument()
    expect(screen.getByText("You can ask for a new code in 50 seconds.")).toBeInTheDocument()
  })
})
