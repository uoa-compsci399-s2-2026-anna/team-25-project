import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { useRouter } from "next/navigation"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { Routes } from "@/lib/routes"
import { resetPassword } from "../actions/resetPassword"
import { ResetPasswordForm } from "./ResetPasswordForm"

vi.mock("../actions/resetPassword", () => ({ resetPassword: vi.fn() }))
vi.mock("next/navigation", () => ({ useRouter: vi.fn() }))

const router = { push: vi.fn(), refresh: vi.fn() }

const submit = (password: string) => {
  fireEvent.change(screen.getByLabelText("New password"), { target: { value: password } })
  fireEvent.click(screen.getByRole("button", { name: "Save password and log in" }))
}

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    // biome-ignore lint/suspicious/noExplicitAny: minimal useRouter mock, only .push/.refresh are used
    vi.mocked(useRouter).mockReturnValue(router as any)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("saves the password with the link's token, then goes home signed in", async () => {
    vi.mocked(resetPassword).mockResolvedValue({ ok: true })
    render(<ResetPasswordForm token="reset-token" />)

    submit("NewPassword1!")

    await waitFor(() => expect(router.push).toHaveBeenCalledWith(Routes.HOME))
    expect(resetPassword).toHaveBeenCalledWith({ password: "NewPassword1!", token: "reset-token" })
    expect(router.refresh).toHaveBeenCalled()
  })

  it("holds back a password that's too short", async () => {
    render(<ResetPasswordForm token="reset-token" />)

    submit("short")

    expect(await screen.findByText("Password must be at least 8 characters")).toBeInTheDocument()
    expect(resetPassword).not.toHaveBeenCalled()
  })

  it("swaps to the dead-link message when the link ran out before submit", async () => {
    vi.mocked(resetPassword).mockResolvedValue({
      formError: "This reset link has expired or has already been used.",
      invalidToken: true,
      ok: false,
    })
    render(<ResetPasswordForm token="reset-token" />)

    submit("NewPassword1!")

    expect(
      await screen.findByRole("heading", { level: 1, name: "This link has expired" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Request a new link" })).toHaveAttribute(
      "href",
      Routes.PASSWORD.FORGOT(),
    )
    expect(screen.queryByLabelText("New password")).not.toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Set a new password" })).not.toBeInTheDocument()
    expect(router.push).not.toHaveBeenCalled()
  })

  it("shows a failure from the server and keeps the form", async () => {
    vi.mocked(resetPassword).mockResolvedValue({
      formError: "We couldn't reset your password. Try again.",
      ok: false,
    })
    render(<ResetPasswordForm token="reset-token" />)

    submit("NewPassword1!")

    expect(
      await screen.findByText("We couldn't reset your password. Try again."),
    ).toBeInTheDocument()
    expect(screen.getByLabelText("New password")).toBeInTheDocument()
  })
})
