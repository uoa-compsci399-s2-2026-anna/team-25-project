import { connection } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import {
  getResourceById,
  getResourceCourseOptions,
  getResources,
  loadResourcesPage,
} from "./resources.queries"

vi.mock("@/lib/payload/getPayloadClient", () => ({ getPayloadClient: vi.fn() }))
vi.mock("next/server", () => ({ connection: vi.fn() }))

const find = vi.fn()
const findByID = vi.fn()
const findDistinct = vi.fn()

beforeEach(() => {
  find.mockReset()
  findByID.mockReset()
  findDistinct.mockReset()
  vi.mocked(connection).mockClear()
  vi.mocked(getPayloadClient).mockResolvedValue({
    find,
    findByID,
    findDistinct,
  } as unknown as Awaited<ReturnType<typeof getPayloadClient>>)
})

describe("getResources", () => {
  it("applies all resource list filters", async () => {
    await getResources(
      { courseId: 4, institutionId: 12, search: "  rubric  ", sort: "oldest" },
      { limit: 10, page: 2 },
    )

    expect(find).toHaveBeenCalledWith({
      collection: "resources",
      depth: 2,
      limit: 10,
      page: 2,
      populate: {
        courses: { code: true },
        members: { avatar: true, firstName: true, lastName: true },
      },
      select: { course: true, createdAt: true, description: true, owner: true, title: true },
      sort: ["createdAt", "id"],
      where: {
        course: { equals: 4 },
        or: [
          { title: { contains: "rubric" } },
          { "owner.firstName": { contains: "rubric" } },
          { "owner.lastName": { contains: "rubric" } },
        ],
        "owner.institution": { equals: 12 },
      },
    })
  })

  it("returns all resources newest first when filters are empty", async () => {
    await getResources({}, { limit: 10, page: 1 })

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ sort: ["-createdAt", "-id"], where: {} }),
    )
  })

  it("sorts by title", async () => {
    await getResources({ sort: "titleAsc" }, { limit: 10, page: 1 })

    expect(find).toHaveBeenCalledWith(expect.objectContaining({ sort: ["title", "id"] }))
  })

  it("ignores a blank search", async () => {
    await getResources({ search: "   " }, { limit: 10, page: 1 })

    expect(find).toHaveBeenCalledWith(expect.objectContaining({ where: {} }))
  })
})

describe("loadResourcesPage", () => {
  it("queries directly when searching, skipping the cache", async () => {
    await loadResourcesPage({ search: "rubric" }, { limit: 10, page: 1 })

    // The owner-name join takes a random alias, which only a request render may hold.
    expect(connection).toHaveBeenCalled()

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ or: expect.any(Array) }) }),
    )
  })
})

describe("getResourceCourseOptions", () => {
  it("labels each course that has a resource with its university", async () => {
    findDistinct.mockResolvedValue({ values: [{ course: 4 }, { course: 9 }, { course: null }] })
    find.mockResolvedValue({
      docs: [
        { code: "COMPSCI 399", id: 9, institution: { id: 12, name: "University of Auckland" } },
        { code: "SE 101", id: 4, institution: 3 },
      ],
    })

    await expect(getResourceCourseOptions()).resolves.toEqual([
      { label: "COMPSCI 399 - University of Auckland", value: 9 },
      { label: "SE 101", value: 4 },
    ])
    expect(findDistinct).toHaveBeenCalledWith(
      expect.objectContaining({ collection: "resources", field: "course", limit: 0 }),
    )
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ collection: "courses", where: { id: { in: [4, 9] } } }),
    )
  })

  it("skips the course lookup when no resource has a course", async () => {
    findDistinct.mockResolvedValue({ values: [{ course: null }] })

    await expect(getResourceCourseOptions()).resolves.toEqual([])
    expect(find).not.toHaveBeenCalled()
  })
})

describe("getResourceById", () => {
  it("loads the resource with only what the detail page draws, returning null when missing", async () => {
    findByID.mockResolvedValue(null)

    await expect(getResourceById(5)).resolves.toBeNull()
    expect(findByID).toHaveBeenCalledWith({
      collection: "resources",
      depth: 2,
      disableErrors: true,
      id: 5,
      populate: {
        courses: { code: true, hasPublishedVersion: true, institution: true },
        institutions: { name: true },
        members: { avatar: true, firstName: true, institution: true, lastName: true },
        resourceAttachments: { filename: true, filesize: true, mimeType: true, url: true },
      },
    })
  })
})
