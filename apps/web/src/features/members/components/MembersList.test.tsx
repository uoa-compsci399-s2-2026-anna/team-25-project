import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { countMembers, getMembers } from "../members.queries"
import { MembersList } from "./MembersList"

vi.mock("../members.queries", () => ({
  countMembers: vi.fn(),
  getMembers: vi.fn(),
  MEMBERS_PAGE_SIZE: 12,
}))

type MembersPage = Awaited<ReturnType<typeof getMembers>>

/** Past the end of a relationship-filtered query, Payload reports no totals at all. */
const emptyPage = (totalPages = 0) =>
  vi.mocked(getMembers).mockResolvedValue({
    docs: [],
    totalDocs: 0,
    totalPages,
  } as unknown as MembersPage)

const renderAt = (page: string, extra: Record<string, string> = {}) =>
  MembersList({ searchParams: Promise.resolve({ page, ...extra }) })

describe("MembersList empty states", () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("says nothing matches when the filters match no one", async () => {
    emptyPage()
    vi.mocked(countMembers).mockResolvedValue(0)

    render(await renderAt("4", { q: "zzzz" }))

    expect(screen.getByText("No members match these filters.")).toBeInTheDocument()
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  it("offers the last page when the page overshoots results that do exist", async () => {
    emptyPage()
    vi.mocked(countMembers).mockResolvedValue(13)

    render(await renderAt("9", { country: "NZ" }))

    expect(screen.getByText("This page is past the end of the results.")).toBeInTheDocument()
    // 13 members over 12 per page is 2 pages, and the link must go to the last one
    // rather than page 1 - find() reports totalPages as 0 here.
    expect(screen.getByRole("link", { name: "Go to the last page" })).toHaveAttribute(
      "href",
      "/members?country=NZ&page=2",
    )
  })

  it("keeps every active filter on the recovery link", async () => {
    emptyPage()
    vi.mocked(countMembers).mockResolvedValue(40)

    render(await renderAt("9", { country: "NZ", institution: "2", q: "tui" }))

    expect(screen.getByRole("link", { name: "Go to the last page" })).toHaveAttribute(
      "href",
      "/members?q=tui&institution=2&country=NZ&page=4",
    )
  })

  it("counts through the same filters the list queried", async () => {
    emptyPage()
    vi.mocked(countMembers).mockResolvedValue(0)

    render(await renderAt("2", { country: "NZ" }))

    expect(countMembers).toHaveBeenCalledWith(expect.objectContaining({ country: "NZ" }))
  })
})
