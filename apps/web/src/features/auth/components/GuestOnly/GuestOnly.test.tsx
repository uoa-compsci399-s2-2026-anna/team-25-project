import { cleanup, render, screen } from "@testing-library/react"
import { redirect } from "next/navigation"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Routes } from "@/lib/routes"
import { GuestOnlyGate } from "./GuestOnly"

vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT")
  }),
}))

const signOut = () => {
  vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })
}

const signInAsMember = () => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    collection: "members",
    // biome-ignore lint/suspicious/noExplicitAny: minimal Member mock, only the discriminant matters here
    user: { id: 1 } as any,
  })
}

const signInAsAdmin = () => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    collection: "admin",
    // biome-ignore lint/suspicious/noExplicitAny: minimal Admin mock, only the discriminant matters here
    user: { id: 1 } as any,
  })
}

describe("GuestOnly", () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("renders children when no user is logged in", async () => {
    signOut()
    render(await GuestOnlyGate({ children: <div>secret</div> }))
    expect(screen.getByText("secret")).toBeInTheDocument()
  })

  it("does not call redirect when rendering children for a guest", async () => {
    signOut()
    render(await GuestOnlyGate({ children: <div>secret</div> }))
    expect(redirect).not.toHaveBeenCalled()
  })

  it("redirects home when a member is logged in", async () => {
    signInAsMember()
    await expect(GuestOnlyGate({ children: <div>secret</div> })).rejects.toThrow()
    expect(redirect).toHaveBeenCalledWith(Routes.HOME)
    expect(redirect).toHaveBeenCalledTimes(1)
  })

  it("redirects home when an admin is logged in", async () => {
    signInAsAdmin()
    await expect(GuestOnlyGate({ children: <div>secret</div> })).rejects.toThrow()
    expect(redirect).toHaveBeenCalledWith(Routes.HOME)
    expect(redirect).toHaveBeenCalledTimes(1)
  })
})
