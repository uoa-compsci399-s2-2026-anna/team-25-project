import { cleanup, render, screen } from "@testing-library/react"
import { redirect } from "next/navigation"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Routes } from "@/lib/routes"
import { MemberOnly } from "./MemberOnly"

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

describe("MemberOnly", () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("redirects home when no user is logged in", async () => {
    signOut()
    await expect(MemberOnly({ children: <div>secret</div> })).rejects.toThrow()
    expect(redirect).toHaveBeenCalledWith(Routes.HOME)
    expect(redirect).toHaveBeenCalledTimes(1)
  })

  it("renders children for a signed-in member", async () => {
    signInAsMember()
    render(await MemberOnly({ children: <div>secret</div> }))
    expect(screen.getByText("secret")).toBeInTheDocument()
    expect(redirect).not.toHaveBeenCalled()
  })

  it("renders children for a signed-in admin", async () => {
    signInAsAdmin()
    render(await MemberOnly({ children: <div>secret</div> }))
    expect(screen.getByText("secret")).toBeInTheDocument()
    expect(redirect).not.toHaveBeenCalled()
  })
})
