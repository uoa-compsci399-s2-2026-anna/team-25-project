import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import {
  getAllCourseOptions,
  getEditableCourseOptions,
  getResourceByIdCached,
} from "../resources.queries"
import type { ResourceCardActionsProps } from "./ResourceCardActions"
import { ResourceCardActionsServer } from "./ResourceCardActionsServer"

vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))
vi.mock("../resources.queries", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../resources.queries")>()),
  getAllCourseOptions: vi.fn(),
  getEditableCourseOptions: vi.fn(),
  getResourceByIdCached: vi.fn(),
}))
// Stands in for the client menu, so each test can read what it was given.
const received = vi.fn()
vi.mock("./ResourceCardActions", () => ({
  ResourceCardActions: (props: ResourceCardActionsProps) => {
    received(props)
    return <button type="button">{`Actions for ${props.title}`}</button>
  },
}))

const description = { root: { children: [], type: "root" } }

const resource = {
  attachments: [
    { filename: "rubric.pdf", filesize: 1024, id: 21 },
    { filename: null, filesize: null, id: 22 },
    // Unpopulated: its row is gone, so there is nothing to list.
    23,
  ],
  course: { code: "COMPSCI 399", id: 9, institution: { id: 12, name: "University of Auckland" } },
  description,
  id: 3,
  owner: { id: 7 },
  title: "Contribution rubric",
}

const member = (id: number) => ({ collection: "members", user: { id } }) as never

const renderServer = async (ownerId: number | undefined = 7) => {
  const element = await ResourceCardActionsServer({
    ownerId,
    resourceId: 3,
    title: "Contribution rubric",
  })
  render(element)
  return element
}

describe("ResourceCardActionsServer", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getResourceByIdCached).mockResolvedValue(resource as never)
    vi.mocked(getEditableCourseOptions).mockResolvedValue([
      { label: "COMPSCI 399 - University of Auckland", value: 9 },
    ])
    vi.mocked(getAllCourseOptions).mockResolvedValue([
      { label: "COMPSCI 399 - University of Auckland", value: 9 },
      { label: "SE 101 - Victoria University", value: 4 },
    ])
  })

  afterEach(() => {
    cleanup()
  })

  it("gives the owner the menu, with the saved values and the courses they can link", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(member(7))

    await renderServer()

    expect(screen.getByRole("button", { name: "Actions for Contribution rubric" })).toBeVisible()
    expect(getEditableCourseOptions).toHaveBeenCalledWith(7)
    expect(received).toHaveBeenCalledWith({
      courses: [{ label: "COMPSCI 399 - University of Auckland", value: 9 }],
      initialValues: { course: 9, description, title: "Contribution rubric" },
      resourceId: 3,
      savedAttachments: [
        { id: 21, name: "rubric.pdf", size: 1024 },
        { id: 22, name: "Attachment", size: undefined },
      ],
      title: "Contribution rubric",
    })
  })

  it("gives an admin the menu with every course", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: "admin", user: { id: 1 } } as never)

    await renderServer()

    expect(getAllCourseOptions).toHaveBeenCalled()
    expect(getEditableCourseOptions).not.toHaveBeenCalled()
    expect(received).toHaveBeenCalledWith(
      expect.objectContaining({
        courses: [
          { label: "COMPSCI 399 - University of Auckland", value: 9 },
          { label: "SE 101 - Victoria University", value: 4 },
        ],
      }),
    )
  })

  it("keeps the linked course in the picker when the owner no longer edits it", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(member(7))
    vi.mocked(getEditableCourseOptions).mockResolvedValue([
      { label: "SE 101 - Victoria University", value: 4 },
    ])

    await renderServer()

    expect(received).toHaveBeenCalledWith(
      expect.objectContaining({
        courses: [
          { label: "COMPSCI 399 - University of Auckland", value: 9 },
          { label: "SE 101 - Victoria University", value: 4 },
        ],
      }),
    )
  })

  it("starts with no course for a resource that has none", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(member(7))
    vi.mocked(getResourceByIdCached).mockResolvedValue({ ...resource, course: null } as never)

    await renderServer()

    expect(received).toHaveBeenCalledWith(
      expect.objectContaining({
        courses: [{ label: "COMPSCI 399 - University of Auckland", value: 9 }],
        initialValues: expect.objectContaining({ course: null }),
      }),
    )
  })

  it.each([
    ["a member who doesn't own it", member(8)],
    ["a guest", { collection: null, user: null } as never],
  ])("shows nothing to %s, without loading the resource", async (_, current) => {
    vi.mocked(getCurrentUser).mockResolvedValue(current)

    expect(await renderServer()).toBeNull()
    expect(getResourceByIdCached).not.toHaveBeenCalled()
  })

  it("shows nothing when the resource is gone", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(member(7))
    vi.mocked(getResourceByIdCached).mockResolvedValue(null)

    expect(await renderServer()).toBeNull()
  })
})
