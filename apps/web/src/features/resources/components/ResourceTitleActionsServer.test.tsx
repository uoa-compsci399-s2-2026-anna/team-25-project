import { cleanup, render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"
import { EditProvider } from "@/components/Editor/EditContext"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getResourceByIdCached } from "../resources.queries"
import { ResourceTitleActionsServer } from "./ResourceTitleActionsServer"

vi.mock("../resources.queries", () => ({ getResourceByIdCached: vi.fn() }))
vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))

// The kebab needs a real editor around it, as on the resource page.
const inEditor = (ui: ReactNode) => (
  <EditProvider onSave={async () => ({ ok: true })} schema={z.object({})}>
    {ui}
  </EditProvider>
)

const resource = (owner: { id: number } | number = { id: 10 }) => ({
  id: 1,
  owner,
  title: "Contribution rubric",
})

const renderActions = async () => render(inEditor(await ResourceTitleActionsServer({ id: 1 })))

const menu = () => screen.queryByRole("button", { name: "Actions for Contribution rubric" })

describe("ResourceTitleActionsServer", () => {
  afterEach(() => {
    cleanup()
    window.history.replaceState(null, "", "/")
  })

  it.each([{ id: 10 }, 10])(
    "shows the dropdown to the resource's owner (owner %o)",
    async (owner) => {
      vi.mocked(getResourceByIdCached).mockResolvedValue(resource(owner) as never)
      vi.mocked(getCurrentUser).mockResolvedValue({
        collection: "members",
        user: { id: 10 },
      } as never)

      await renderActions()

      expect(menu()).toBeInTheDocument()
    },
  )

  it("shows the dropdown to an admin who doesn't own the resource", async () => {
    vi.mocked(getResourceByIdCached).mockResolvedValue(resource() as never)
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: "admin", user: { id: 999 } } as never)

    await renderActions()

    expect(menu()).toBeInTheDocument()
  })

  it.each([
    ["a member who doesn't own it", { collection: "members", user: { id: 999 } }],
    ["a signed-out visitor", { collection: null, user: null }],
  ])("hides the dropdown from %s", async (_, current) => {
    vi.mocked(getResourceByIdCached).mockResolvedValue(resource() as never)
    vi.mocked(getCurrentUser).mockResolvedValue(current as never)

    const { container } = await renderActions()

    expect(container).toBeEmptyDOMElement()
  })

  it("renders nothing when the resource can't be found", async () => {
    vi.mocked(getResourceByIdCached).mockResolvedValue(null as never)
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: "admin", user: { id: 1 } } as never)

    const { container } = await renderActions()

    expect(container).toBeEmptyDOMElement()
  })

  it("opens the editor straight away when the page is opened with #edit", async () => {
    window.history.replaceState(null, "", "/resources/1#edit")
    vi.mocked(getResourceByIdCached).mockResolvedValue(resource() as never)
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      user: { id: 10 },
    } as never)

    await renderActions()

    expect(await screen.findByRole("button", { name: "Done" })).toBeInTheDocument()
    expect(window.location.hash).toBe("")
  })
})
