import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getMemberResourcesCached } from "../members.queries"
import { MemberResources, MemberResourcesSkeleton } from "./MemberDetailResources"

vi.mock("../members.queries", () => ({ getMemberResourcesCached: vi.fn() }))
vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))

type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>

const signedIn = { collection: "members", user: { id: 1 } } as unknown as CurrentUser
const guest = { collection: null, user: null } as unknown as CurrentUser

const renderResources = async () =>
  render(await MemberResources({ params: Promise.resolve({ memberId: "7" }) }))

describe("MemberResources", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCurrentUser).mockResolvedValue(signedIn)
  })

  afterEach(() => {
    cleanup()
  })

  it("links each resource to its page, with its course, shared date and attachments", async () => {
    vi.mocked(getMemberResourcesCached).mockResolvedValue([
      {
        attachments: [{ id: 1 }, { id: 2 }],
        course: { code: "COMPSCI 399", id: 4 },
        createdAt: "2026-06-03T00:00:00.000Z",
        id: 18,
        title: "Individual contribution rubric",
      },
    ] as never)

    await renderResources()

    expect(getMemberResourcesCached).toHaveBeenCalledWith(7)
    expect(screen.getByRole("link", { name: /Individual contribution rubric/ })).toHaveAttribute(
      "href",
      "/resources/18",
    )
    expect(screen.getByText("COMPSCI 399")).toBeInTheDocument()
    expect(screen.getByText("Shared 3 Jun 2026")).toBeInTheDocument()
    expect(screen.getByText("2 attachments")).toBeInTheDocument()
  })

  it("labels a resource with no course, and leaves out an attachment count of zero", async () => {
    vi.mocked(getMemberResourcesCached).mockResolvedValue([
      {
        attachments: [],
        course: null,
        createdAt: "2026-06-03T00:00:00.000Z",
        id: 19,
        title: "Reading list",
      },
    ] as never)

    await renderResources()

    expect(screen.getByText("Resource")).toBeInTheDocument()
    expect(screen.queryByText(/attachment/)).not.toBeInTheDocument()
  })

  it("says so when the member has shared nothing", async () => {
    vi.mocked(getMemberResourcesCached).mockResolvedValue([])

    await renderResources()

    expect(screen.getByText("No resources shared yet.")).toBeInTheDocument()
  })

  it("asks a guest to sign in instead of listing or loading the member's resources", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(guest)

    await renderResources()

    expect(screen.getByRole("heading", { name: "Resources" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login?redirect=%2Fmembers%2F7",
    )
    expect(getMemberResourcesCached).not.toHaveBeenCalled()
  })
})

describe("MemberResourcesSkeleton", () => {
  it("renders placeholders for the heading and two cards", () => {
    const { container } = render(<MemberResourcesSkeleton />)
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3)
    cleanup()
  })
})
