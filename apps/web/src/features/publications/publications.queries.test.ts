import { PublicationType } from "@repo/shared/enums/publications"
import { connection } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import {
  getPublications,
  getPublicationTags,
  getPublicationYears,
  loadPublicationsPage,
} from "./publications.queries"

vi.mock("@/lib/payload/getPayloadClient", () => ({ getPayloadClient: vi.fn() }))
vi.mock("next/server", () => ({ connection: vi.fn() }))

const find = vi.fn()
const findDistinct = vi.fn()

beforeEach(() => {
  find.mockReset()
  findDistinct.mockReset()
  vi.mocked(connection).mockClear()
  vi.mocked(getPayloadClient).mockResolvedValue({
    find,
    findDistinct,
  } as unknown as Awaited<ReturnType<typeof getPayloadClient>>)
})

describe("getPublications", () => {
  it("applies all publication list filters", async () => {
    await getPublications(
      {
        search: "  capstone  ",
        sort: "oldest",
        tags: ["Teamwork", "Assessment"],
        type: PublicationType.ARTICLE,
        year: 2024,
      },
      { limit: 10, page: 2 },
    )

    expect(find).toHaveBeenCalledWith({
      collection: "publications",
      depth: 2,
      limit: 10,
      page: 2,
      populate: { members: { avatar: true } },
      sort: ["year", "month", "id"],
      where: {
        or: [
          { title: { contains: "capstone" } },
          { venue: { contains: "capstone" } },
          { abstract: { contains: "capstone" } },
          { "authors.name": { contains: "capstone" } },
        ],
        tags: { in: ["Teamwork", "Assessment"] },
        type: { equals: PublicationType.ARTICLE },
        year: { equals: 2024 },
      },
    })
  })

  it("returns all publications newest first when filters are empty", async () => {
    await getPublications({}, { limit: 20, page: 1 })

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ sort: ["-year", "-month", "-id"], where: {} }),
    )
  })

  it("sorts by title", async () => {
    await getPublications({ sort: "titleAsc" }, { limit: 10, page: 1 })

    expect(find).toHaveBeenCalledWith(expect.objectContaining({ sort: ["title", "id"] }))
  })
})

describe("loadPublicationsPage", () => {
  it("loads a searched publication page directly", async () => {
    find.mockResolvedValue({ docs: [], totalDocs: 0 })

    await loadPublicationsPage({ search: "capstone" }, { limit: 10, page: 3 })

    expect(find).toHaveBeenCalledWith(expect.objectContaining({ limit: 10, page: 3 }))
  })

  it("opts a tag-filtered page out of prerendering before the query", async () => {
    find.mockResolvedValue({ docs: [], totalDocs: 0 })

    await loadPublicationsPage({ tags: ["Teamwork"] }, { limit: 10, page: 1 })

    expect(connection).toHaveBeenCalledOnce()
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tags: { in: ["Teamwork"] } } }),
    )
  })
})

describe("getPublicationTags", () => {
  it("lists every publication tag and leaves out the null of untagged publications", async () => {
    findDistinct.mockResolvedValue({
      values: [{ tags: "Assessment" }, { tags: "Teamwork" }, { tags: null }],
    })

    expect(await getPublicationTags()).toEqual(["Assessment", "Teamwork"])
    expect(findDistinct).toHaveBeenCalledWith({
      collection: "publications",
      field: "tags",
      limit: 0,
      sort: "tags",
    })
  })
})

describe("getPublicationYears", () => {
  it("lists every publication year, newest first", async () => {
    findDistinct.mockResolvedValue({ values: [{ year: 2025 }, { year: 2021 }] })

    expect(await getPublicationYears()).toEqual([2025, 2021])
    expect(findDistinct).toHaveBeenCalledWith({
      collection: "publications",
      field: "year",
      limit: 0,
      sort: "-year",
    })
  })
})
