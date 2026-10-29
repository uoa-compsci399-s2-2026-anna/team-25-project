import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { useQueryState } from "nuqs"
import { NuqsTestingAdapter, withNuqsTestingAdapter } from "nuqs/adapters/testing"
import { afterEach, describe, expect, it, vi } from "vitest"
import { requestPasswordReset } from "../actions/requestPasswordReset"
import { ForgotPasswordForm } from "./ForgotPasswordForm"

vi.mock("../actions/requestPasswordReset", () => ({ requestPasswordReset: vi.fn() }))

const renderForm = (searchParams: Record<string, string> = {}) =>
  render(<ForgotPasswordForm />, { wrapper: withNuqsTestingAdapter({ searchParams }) })

const submit = (email?: string) => {
  if (email !== undefined) {
    fireEvent.change(screen.getByLabelText("University email"), { target: { value: email } })
  }
  fireEvent.click(screen.getByRole("button", { name: "Send reset link" }))
}

describe("ForgotPasswordForm", () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it("starts with the email from the link that opened it", () => {
    renderForm({ email: "a.tui@uni.ac.nz" })
    expect(screen.getByLabelText("University email")).toHaveValue("a.tui@uni.ac.nz")
  })

  // Next shows a page kept from an earlier visit rather than remounting it,
  // so only the search param changes - here through a nuqs setter.
  it("picks up a new email in the link while the page is kept alive", () => {
    const ChangeEmail = () => {
      const [, setEmail] = useQueryState("email")
      return (
        <button onClick={() => void setEmail("a.tui@uni.ac.nz")} type="button">
          Arrive with an email
        </button>
      )
    }
    render(
      <NuqsTestingAdapter searchParams={{}}>
        <ChangeEmail />
        <ForgotPasswordForm />
      </NuqsTestingAdapter>,
    )
    // Used on the earlier visit, so the form no longer follows its defaults.
    fireEvent.change(screen.getByLabelText("University email"), {
      target: { value: "typed.before@uni.ac.nz" },
    })

    fireEvent.click(screen.getByRole("button", { name: "Arrive with an email" }))
    expect(screen.getByLabelText("University email")).toHaveValue("a.tui@uni.ac.nz")
  })

  it("holds back an invalid email", async () => {
    renderForm()
    submit("not-an-email")

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument()
    expect(requestPasswordReset).not.toHaveBeenCalled()
  })

  it("swaps to the inbox step, worded the same whether or not the account exists", async () => {
    vi.mocked(requestPasswordReset).mockResolvedValue({ ok: true })
    renderForm()
    submit("a.tui@uni.ac.nz")

    expect(
      await screen.findByRole("heading", { level: 1, name: "Check your inbox" }),
    ).toBeInTheDocument()
    expect(screen.getByText(/If there's an account for/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Resend email in 2:00" })).toBeDisabled()
  })

  it("lets the member resend once the countdown runs out", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.mocked(requestPasswordReset).mockResolvedValue({ ok: true })
    renderForm()
    submit("a.tui@uni.ac.nz")
    await screen.findByRole("heading", { name: "Check your inbox" })

    for (let second = 0; second < 120; second++) {
      await act(async () => {
        vi.advanceTimersByTime(1000)
      })
    }
    fireEvent.click(screen.getByRole("button", { name: "Resend email" }))

    expect(
      await screen.findByText("Sent again. Only the newest link will work."),
    ).toBeInTheDocument()
    expect(requestPasswordReset).toHaveBeenLastCalledWith({ email: "a.tui@uni.ac.nz" })
  })

  it("waits out a recent send rather than asking for the email again", async () => {
    vi.mocked(requestPasswordReset).mockResolvedValue({
      formError: "You can ask for another email in 2 minutes.",
      ok: false,
      retryAfterSeconds: 90,
    })
    renderForm()
    submit("a.tui@uni.ac.nz")

    expect(await screen.findByRole("heading", { name: "Check your inbox" })).toBeInTheDocument()
    expect(screen.getByText("You can ask for another email in 2 minutes.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Resend email in 1:30" })).toBeDisabled()
  })

  it("goes back to the form, keeping the email, to use a different one", async () => {
    vi.mocked(requestPasswordReset).mockResolvedValue({ ok: true })
    renderForm()
    submit("a.tui@uni.ac.nz")
    fireEvent.click(await screen.findByRole("button", { name: "Use a different email" }))

    expect(screen.getByRole("heading", { name: "Reset your password" })).toBeInTheDocument()
    expect(screen.getByLabelText("University email")).toHaveValue("a.tui@uni.ac.nz")
  })

  it("shows a failed send and keeps the form", async () => {
    vi.mocked(requestPasswordReset).mockResolvedValue({
      formError: "We couldn't send the email right now. Try again.",
      ok: false,
    })
    renderForm()
    submit("a.tui@uni.ac.nz")

    await waitFor(() =>
      expect(
        screen.getByText("We couldn't send the email right now. Try again."),
      ).toBeInTheDocument(),
    )
    expect(screen.getByLabelText("University email")).toBeInTheDocument()
  })
})
