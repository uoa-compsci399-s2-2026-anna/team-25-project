import { Toaster, toast } from "@repo/ui/components/ui"
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { useRouter } from "next/navigation"
import { withNuqsTestingAdapter } from "nuqs/adapters/testing"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { loginAction } from "@/features/auth/actions/auth"
import { LoginForm } from "./LoginForm"

vi.mock("@/features/auth/actions/auth", () => ({ loginAction: vi.fn() }))
vi.mock("next/navigation", () => ({ useRouter: vi.fn() }))

function fillValidCredentials() {
  fireEvent.change(screen.getByLabelText("University email"), {
    target: { value: "member@uni.edu" },
  })
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "password123" },
  })
}

describe("LoginForm", () => {
  beforeEach(() => {
    // biome-ignore lint/suspicious/noExplicitAny: minimal useRouter mock, only .push/.refresh are used
    vi.mocked(useRouter).mockReturnValue({ push: vi.fn(), refresh: vi.fn() } as any)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    act(() => {
      toast.close()
    })
  })

  it("renders the email field, password field, and submit button", () => {
    render(<LoginForm />, { wrapper: withNuqsTestingAdapter() })
    expect(screen.getByLabelText("University email")).toBeInTheDocument()
    expect(screen.getByLabelText("Password")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Log in" })).toBeInTheDocument()
  })

  it("shows a validation error and does not call loginAction for an invalid email", async () => {
    render(<LoginForm />, { wrapper: withNuqsTestingAdapter() })
    fireEvent.change(screen.getByLabelText("University email"), {
      target: { value: "not-an-email" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Log in" }))

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument()
    expect(loginAction).not.toHaveBeenCalled()
  })

  it("redirects home after a successful login", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: minimal loginAction mock return value
    vi.mocked(loginAction).mockResolvedValue({ success: true, result: {} } as any)
    render(<LoginForm />, { wrapper: withNuqsTestingAdapter() })
    fillValidCredentials()
    fireEvent.click(screen.getByRole("button", { name: "Log in" }))

    const router = useRouter()
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/"))
    expect(router.refresh).toHaveBeenCalled()
    expect(loginAction).toHaveBeenCalledWith("member@uni.edu", "password123")
  })

  it("redirects to the redirect param after a successful login", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: minimal loginAction mock return value
    vi.mocked(loginAction).mockResolvedValue({ success: true, result: {} } as any)
    render(<LoginForm />, {
      wrapper: withNuqsTestingAdapter({ searchParams: { redirect: "/proposals?q=ai" } }),
    })
    fillValidCredentials()
    fireEvent.click(screen.getByRole("button", { name: "Log in" }))

    const router = useRouter()
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/proposals?q=ai"))
  })

  it("ignores a redirect param that leaves the site", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: minimal loginAction mock return value
    vi.mocked(loginAction).mockResolvedValue({ success: true, result: {} } as any)
    render(<LoginForm />, {
      wrapper: withNuqsTestingAdapter({ searchParams: { redirect: "//evil.com" } }),
    })
    fillValidCredentials()
    fireEvent.click(screen.getByRole("button", { name: "Log in" }))

    const router = useRouter()
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/"))
  })

  it("carries the redirect param through to the register link", () => {
    render(<LoginForm />, {
      wrapper: withNuqsTestingAdapter({ searchParams: { redirect: "/courses" } }),
    })
    expect(screen.getByRole("link", { name: /New here/ })).toHaveAttribute(
      "href",
      "/register?redirect=%2Fcourses",
    )
  })

  it("does not show a validation error when blurring an empty field", async () => {
    render(<LoginForm />, { wrapper: withNuqsTestingAdapter() })
    const emailInput = screen.getByLabelText("University email")
    fireEvent.focus(emailInput)
    fireEvent.blur(emailInput)

    expect(screen.queryByText("Enter a valid email address")).not.toBeInTheDocument()
  })

  it("shows a validation error on blur for a non-empty invalid email", async () => {
    render(<LoginForm />, { wrapper: withNuqsTestingAdapter() })
    fireEvent.change(screen.getByLabelText("University email"), {
      target: { value: "not-an-email" },
    })
    fireEvent.blur(screen.getByLabelText("University email"))

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument()
  })

  it("shows a failure toast with the server's message when login fails", async () => {
    vi.mocked(loginAction).mockResolvedValue({
      success: false,
      message: "Invalid email or password",
    })
    render(
      <Toaster>
        <LoginForm />
      </Toaster>,
      { wrapper: withNuqsTestingAdapter() },
    )
    fillValidCredentials()
    fireEvent.click(screen.getByRole("button", { name: "Log in" }))

    expect(await screen.findByText("Login failed")).toBeInTheDocument()
    expect(screen.getByText("Invalid email or password")).toBeInTheDocument()
    const router = useRouter()
    expect(router.push).not.toHaveBeenCalled()
  })
})
