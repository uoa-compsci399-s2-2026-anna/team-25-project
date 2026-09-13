import { Toaster, toast } from "@repo/ui/components/ui"
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { useRouter } from "next/navigation"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { logoutAction } from "@/features/auth/actions/logout"
import { LogoutButton } from "./LogoutButton"

vi.mock("@/features/auth/actions/logout", () => ({ logoutAction: vi.fn() }))
vi.mock("next/navigation", () => ({ useRouter: vi.fn() }))

describe("LogoutButton", () => {
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

  it("renders with the default label", () => {
    render(<LogoutButton />)
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument()
  })

  it("renders custom children when provided", () => {
    render(<LogoutButton>Sign out</LogoutButton>)
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument()
  })

  it("forwards additional Button props to the underlying Button", () => {
    render(<LogoutButton disabled />)
    expect(screen.getByRole("button", { name: "Logout" })).toBeDisabled()
  })

  it("refreshes and redirects home after a successful logout, showing the server's message", async () => {
    vi.mocked(logoutAction).mockResolvedValue({
      success: true,
      message: "User logged out successfully",
    })
    render(
      <Toaster>
        <LogoutButton />
      </Toaster>,
    )
    fireEvent.click(screen.getByRole("button", { name: "Logout" }))

    const router = useRouter()
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/"))
    expect(router.refresh).toHaveBeenCalled()
    expect(logoutAction).toHaveBeenCalled()
    expect(await screen.findByText("User logged out successfully")).toBeInTheDocument()
  })

  it("shows a failure toast with the server's message when logout fails", async () => {
    vi.mocked(logoutAction).mockResolvedValue({
      success: false,
      message: "We couldn't log you out. Try again later.",
    })
    render(
      <Toaster>
        <LogoutButton />
      </Toaster>,
    )
    fireEvent.click(screen.getByRole("button", { name: "Logout" }))

    expect(await screen.findByText("Logout failed")).toBeInTheDocument()
    expect(screen.getByText("We couldn't log you out. Try again later.")).toBeInTheDocument()
    const router = useRouter()
    expect(router.push).not.toHaveBeenCalled()
  })

  it("shows a failure toast when the server action call itself fails (e.g. network error)", async () => {
    vi.mocked(logoutAction).mockRejectedValue(new Error("Network error"))
    render(
      <Toaster>
        <LogoutButton />
      </Toaster>,
    )
    fireEvent.click(screen.getByRole("button", { name: "Logout" }))

    expect(await screen.findByText("Logout failed")).toBeInTheDocument()
    const router = useRouter()
    expect(router.push).not.toHaveBeenCalled()
  })

  it("disables the button while logging out so a double-click can't fire a second request", async () => {
    let resolveLogout: (result: { success: true; message: string }) => void = () => {}
    vi.mocked(logoutAction).mockReturnValue(
      new Promise((resolve) => {
        resolveLogout = resolve
      }),
    )
    render(<LogoutButton />)
    const button = screen.getByRole("button", { name: "Logout" })

    fireEvent.click(button)
    fireEvent.click(button)

    await waitFor(() => expect(button).toBeDisabled())
    expect(logoutAction).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveLogout({ success: true, message: "User logged out successfully" })
    })
  })
})
