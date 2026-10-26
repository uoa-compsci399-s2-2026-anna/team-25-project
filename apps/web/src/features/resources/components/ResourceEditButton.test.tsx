import { cleanup, render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"
import { EditProvider } from "@/components/Editor/EditContext"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getResourceByIdCached } from "../resources.queries"
import { ResourceEditButton } from "./ResourceEditButton"

vi.mock("../resources.queries", () => ({ getResourceByIdCached: vi.fn() }))
vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))

const resource = (owner: { id: number } | number = { id: 10 }) => ({ id: 1, owner })

// The Edit button needs an editor around it, as on the resource page.
const inEditor = (ui: ReactNode) => (
  <EditProvider onSave={async () => ({ ok: true })} schema={z.object({})}>
    {ui}
  </EditProvider>
)

const renderButton = async () => render(inEditor(await ResourceEditButton({ id: 1 })))

const editButton = () => screen.queryByRole("button", { name: "Edit resource" })

describe("ResourceEditButton", () => {
  afterEach(() => {
    cleanup()
  })

  it.each([{ id: 10 }, 10])("shows to the resource's owner (owner %o)", async (owner) => {
    vi.mocked(getResourceByIdCached).mockResolvedValue(resource(owner) as never)
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      user: { id: 10 },
    } as never)

    await renderButton()
    expect(editButton()).toBeInTheDocument()
  })

  it("shows to an admin, even though they don't own it", async () => {
    vi.mocked(getResourceByIdCached).mockResolvedValue(resource() as never)
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "admin",
      user: { id: 999 },
    } as never)

    await renderButton()
    expect(editButton()).toBeInTheDocument()
  })

  it("hides from another member", async () => {
    vi.mocked(getResourceByIdCached).mockResolvedValue(resource() as never)
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      user: { id: 11 },
    } as never)

    await renderButton()
    expect(editButton()).not.toBeInTheDocument()
  })

  it("hides from a guest", async () => {
    vi.mocked(getResourceByIdCached).mockResolvedValue(resource() as never)
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })

    await renderButton()
    expect(editButton()).not.toBeInTheDocument()
  })

  it("renders nothing when the resource is gone", async () => {
    vi.mocked(getResourceByIdCached).mockResolvedValue(null)
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })

    expect(await ResourceEditButton({ id: 1 })).toBeNull()
  })
})
