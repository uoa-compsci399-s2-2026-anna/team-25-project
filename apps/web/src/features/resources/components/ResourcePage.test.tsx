import type { Resource } from "@repo/shared/payload-types"
import { cleanup, render, screen, within } from "@testing-library/react"
import { notFound } from "next/navigation"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getResourceByIdCached } from "../resources.queries"
import { ResourcePage } from "./ResourcePage"

vi.mock("../resources.queries", () => ({ getResourceByIdCached: vi.fn() }))
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND")
  }),
}))
// The rich-text renderer is covered elsewhere and needs Lexical's full node set.
vi.mock("@/components/RichTextContent", () => ({
  RichTextContent: () => <p>Description</p>,
}))

const resource = (overrides: Partial<Resource> = {}): Resource =>
  ({
    attachments: [
      {
        filename: "rubric.pdf",
        filesize: 2_516_582,
        id: 3,
        mimeType: "application/pdf",
        url: "/payload/api/resourceAttachments/file/rubric.pdf",
      },
    ],
    course: {
      code: "SE 101",
      hasPublishedVersion: true,
      id: 4,
      institution: { id: 12, name: "University of Auckland" },
    },
    createdAt: "2026-06-03T00:00:00.000Z",
    description: { root: {} },
    id: 1,
    owner: {
      firstName: "Anna",
      id: 7,
      institution: { id: 12, name: "University of Auckland" },
      lastName: "Tui",
    },
    title: "Individual contribution rubric",
    updatedAt: "2026-06-03T00:00:00.000Z",
    ...overrides,
  }) as Resource

const renderPage = async (doc: Resource | null = resource(), resourceId = "1") => {
  vi.mocked(getResourceByIdCached).mockResolvedValue(doc)
  render(await ResourcePage({ params: Promise.resolve({ resourceId }) }))
}

describe("ResourcePage", () => {
  afterEach(() => {
    cleanup()
  })

  it("shows the title, course, owner and description", async () => {
    await renderPage()

    expect(getResourceByIdCached).toHaveBeenCalledWith(1)
    expect(screen.getByRole("heading", { level: 1, name: "Individual contribution rubric" }))
    expect(screen.getByText("Shared 3 Jun 2026")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Anna Tui/ })).toHaveAttribute("href", "/members/7")
    expect(screen.getByText("Description")).toBeInTheDocument()
  })

  it("lists the attachments to download", async () => {
    await renderPage()

    expect(screen.getByText("Attachments - 1")).toBeInTheDocument()
    expect(screen.getByText("PDF - 2.4 MB")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Download rubric.pdf" })).toHaveAttribute(
      "href",
      "/payload/api/resourceAttachments/file/rubric.pdf",
    )
  })

  it("says so when nothing is attached", async () => {
    await renderPage(resource({ attachments: [] }))

    expect(screen.getByText("Attachments - 0")).toBeInTheDocument()
    expect(screen.getByText("No files have been attached.")).toBeInTheDocument()
  })

  it("links the course and names its university in the details card", async () => {
    await renderPage()

    const details = screen.getByRole("complementary")
    expect(within(details).getByRole("link", { name: "SE 101" })).toHaveAttribute(
      "href",
      "/courses/4",
    )
    expect(within(details).getByText("University of Auckland")).toBeInTheDocument()
  })

  it("leaves an unpublished course unlinked, since its page would 404", async () => {
    await renderPage(
      resource({
        course: { code: "SE 101", hasPublishedVersion: false, id: 4, institution: 12 },
      } as Partial<Resource>),
    )

    expect(within(screen.getByRole("complementary")).queryByRole("link")).not.toBeInTheDocument()
  })

  it("says when the resource has no course", async () => {
    await renderPage(resource({ course: null }))

    expect(screen.getByText("Not linked to a course")).toBeInTheDocument()
    expect(document.querySelector("[data-slot=badge]")).not.toBeInTheDocument()
  })

  it("shows the update date only when it differs from the shared date", async () => {
    await renderPage(resource({ updatedAt: "2026-07-10T00:00:00.000Z" }))
    expect(screen.getByText("updated 10 Jul 2026")).toBeInTheDocument()
  })

  it("404s when the resource does not exist", async () => {
    await expect(renderPage(null)).rejects.toThrow("NEXT_NOT_FOUND")
    expect(notFound).toHaveBeenCalled()
  })
})
