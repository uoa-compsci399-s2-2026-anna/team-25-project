import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Routes } from "@/lib/routes"
import { AdminBanner } from "./AdminBanner"

vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))

const renderAdminBanner = async () => render(await AdminBanner())

describe("AdminBanner", () => {
  afterEach(() => {
    cleanup()
  })

  it("tells an admin they're in admin mode and links to the dashboard", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "admin",
      // biome-ignore lint/suspicious/noExplicitAny: AdminBanner only reads the collection
      user: { id: 1 } as any,
    })
    await renderAdminBanner()
    expect(screen.getByText(/You're signed in as an admin\./)).toBeInTheDocument()
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Open the admin dashboard" })).toHaveAttribute(
      "href",
      Routes.ADMIN,
    )
  })

  it("renders nothing for a member", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      // biome-ignore lint/suspicious/noExplicitAny: AdminBanner only reads the collection
      user: { id: 1 } as any,
    })
    const { container } = await renderAdminBanner()
    expect(container).toBeEmptyDOMElement()
  })

  it("renders nothing for a guest", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })
    const { container } = await renderAdminBanner()
    expect(container).toBeEmptyDOMElement()
  })
})
