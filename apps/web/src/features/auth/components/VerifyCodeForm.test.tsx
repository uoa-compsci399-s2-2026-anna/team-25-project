import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { VerifyCodeForm } from "./VerifyCodeForm"

const onBack = vi.fn()
const onResend = vi.fn()
const onVerify = vi.fn()

const renderForm = (initialWaitSeconds?: number, initialFormError?: string) =>
  render(
    <VerifyCodeForm
      email="a.tui@example.ac.nz"
      initialFormError={initialFormError}
      initialWaitSeconds={initialWaitSeconds}
      onBack={onBack}
      onResend={onResend}
      onVerify={onVerify}
    />,
  )

const enterCode = (code: string) =>
  fireEvent.change(screen.getByLabelText("Verification code"), { target: { value: code } })

const submit = () => fireEvent.click(screen.getByRole("button", { name: "Verify & continue" }))

describe("VerifyCodeForm", () => {
  beforeEach(() => {
    onVerify.mockResolvedValue({ ok: true })
    onResend.mockResolvedValue({ ok: true })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it("says where the code went and how long it lasts", () => {
    renderForm()

    expect(screen.getByText("a.tui@example.ac.nz")).toBeInTheDocument()
    expect(screen.getByText(/expires in 15 minutes/)).toBeInTheDocument()
  })

  it("offers the input to the browser's one-time-code autofill", () => {
    renderForm()

    const input = screen.getByLabelText("Verification code")
    expect(input).toHaveAttribute("autocomplete", "one-time-code")
    expect(input).toHaveAttribute("inputmode", "numeric")
  })

  it("keeps only digits as the code is typed or pasted", () => {
    renderForm()

    enterCode("48 29-13")

    expect(screen.getByLabelText("Verification code")).toHaveValue("482913")
  })

  it("keeps all six digits of a paste padded with spaces", () => {
    renderForm()

    // No maxLength on the input: a browser would cut this paste to 6 characters,
    // dropping a digit, before the spaces could be stripped.
    enterCode(" 482 913 7")

    const input = screen.getByLabelText("Verification code")
    expect(input).toHaveValue("482913")
    expect(input).not.toHaveAttribute("maxlength")
  })

  it("submits the code", async () => {
    renderForm()
    enterCode("482913")
    submit()

    await waitFor(() => expect(onVerify).toHaveBeenCalledWith("482913"))
  })

  it("asks for all six digits before submitting", async () => {
    renderForm()
    enterCode("4829")
    submit()

    expect(await screen.findByText("Enter the 6-digit code from the email")).toBeInTheDocument()
    expect(onVerify).not.toHaveBeenCalled()
  })

  it("shows why a code was refused", async () => {
    onVerify.mockResolvedValue({
      fieldErrors: { code: "That code isn't right. Check the email and try again." },
      ok: false,
    })
    renderForm()
    enterCode("482913")
    submit()

    expect(
      await screen.findByText("That code isn't right. Check the email and try again."),
    ).toBeInTheDocument()
  })

  it("counts down before a resend is allowed", () => {
    vi.useFakeTimers()
    renderForm(3)

    expect(screen.getByRole("button", { name: "Resend code in 3s" })).toBeDisabled()
    // One tick at a time: each second is scheduled after the previous one renders.
    for (let second = 0; second < 3; second++) act(() => vi.advanceTimersByTime(1_000))
    expect(screen.getByRole("button", { name: "Resend code" })).toBeEnabled()
  })

  it("sends a new code and restarts the countdown", async () => {
    renderForm(0)
    enterCode("1234")
    fireEvent.click(screen.getByRole("button", { name: "Resend code" }))

    expect(
      await screen.findByText("We sent a new code to a.tui@example.ac.nz."),
    ).toBeInTheDocument()
    expect(onResend).toHaveBeenCalledOnce()
    expect(screen.getByLabelText("Verification code")).toHaveValue("")
    expect(screen.getByRole("button", { name: "Resend code in 60s" })).toBeDisabled()
  })

  it("waits as long as the server says when a resend is refused", async () => {
    onResend.mockResolvedValue({
      formError: "You can ask for a new code in 45 minutes.",
      ok: false,
      retryAfterSeconds: 2_700,
    })
    renderForm(0)
    fireEvent.click(screen.getByRole("button", { name: "Resend code" }))

    expect(await screen.findByText("You can ask for a new code in 45 minutes.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Resend code in 45:00" })).toBeDisabled()
  })

  it("explains on arrival why a resend has to wait", () => {
    renderForm(2_700, "You can ask for a new code in 45 minutes.")

    expect(screen.getByText("You can ask for a new code in 45 minutes.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Resend code in 45:00" })).toBeDisabled()
  })

  it("goes back to the details", () => {
    renderForm()
    fireEvent.click(screen.getByRole("button", { name: "Change your details" }))

    expect(onBack).toHaveBeenCalledOnce()
  })
})
