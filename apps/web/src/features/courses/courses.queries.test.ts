import { beforeEach, describe, expect, it, vi } from "vitest"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import {
  getLatestPublishedOffering,
  getPublishedCourse,
  getPublishedOffering,
  getPublishedOfferings,
  getSelectedOffering,
} from "./courses.queries"

vi.mock("@/lib/payload/getPayloadClient", () => ({ getPayloadClient: vi.fn() }))
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))

const find = vi.fn()

const NEWEST_FIRST = ["-startDate", "-id"]

const publishedOfferings = {
  and: [{ course: { equals: 7 } }, { _status: { equals: "published" } }],
}

beforeEach(() => {
  find.mockReset().mockResolvedValue({ docs: [] })
  vi.mocked(getPayloadClient).mockResolvedValue({
    find,
  } as unknown as Awaited<ReturnType<typeof getPayloadClient>>)
})

describe("getPublishedCourse", () => {
  it("reads the course only when it has a published offering", async () => {
    await getPublishedCourse(7)

    expect(find).toHaveBeenCalledWith({
      collection: "courses",
      where: { and: [{ id: { equals: 7 } }, { hasPublishedVersion: { equals: true } }] },
      depth: 0,
      limit: 1,
      pagination: false,
    })
  })

  it("returns null when the course has no published offering", async () => {
    await expect(getPublishedCourse(7)).resolves.toBeNull()
  })
})

describe("getPublishedOfferings", () => {
  it("reads courseVersions by the course relationship, newest period first", async () => {
    await getPublishedOfferings(7)

    expect(find).toHaveBeenCalledWith({
      collection: "courseVersions",
      where: publishedOfferings,
      sort: NEWEST_FIRST,
      depth: 0,
      pagination: false,
    })
  })

  it("returns every offering rather than Payload's first page", async () => {
    const docs = [{ id: 2 }, { id: 1 }]
    find.mockResolvedValue({ docs })

    await expect(getPublishedOfferings(7)).resolves.toEqual(docs)
  })
})

describe("getLatestPublishedOffering", () => {
  it("takes the newest teaching period, not the most recently edited offering", async () => {
    await getLatestPublishedOffering(7)

    expect(find).toHaveBeenCalledWith({
      collection: "courseVersions",
      where: publishedOfferings,
      sort: NEWEST_FIRST,
      depth: 0,
      limit: 1,
      pagination: false,
    })
  })
})

describe("getPublishedOffering", () => {
  // The course ID comes from the URL, so an offering belonging to another course
  // must miss rather than render under the course in the address bar.
  it("scopes the offering to its course", async () => {
    await getPublishedOffering(7, 42)

    expect(find).toHaveBeenCalledWith({
      collection: "courseVersions",
      where: { and: [{ id: { equals: 42 } }, publishedOfferings] },
      depth: 0,
      limit: 1,
      pagination: false,
    })
  })

  it("returns null when the offering is not published under that course", async () => {
    await expect(getPublishedOffering(7, 42)).resolves.toBeNull()
  })
})

describe("getSelectedOffering", () => {
  it("uses the latest offering when none is selected", async () => {
    const latest = { id: 8 }
    find.mockResolvedValue({ docs: [latest] })

    await expect(getSelectedOffering(7)).resolves.toBe(latest)
    expect(find).toHaveBeenCalledTimes(1)
  })

  it("returns a selected offering without querying for the latest", async () => {
    const selected = { id: 42 }
    find.mockResolvedValue({ docs: [selected] })

    await expect(getSelectedOffering(7, 42)).resolves.toBe(selected)
    expect(find).toHaveBeenCalledTimes(1)
  })

  it("falls back to the latest offering when the selected offering misses", async () => {
    const latest = { id: 8 }
    find.mockResolvedValueOnce({ docs: [] }).mockResolvedValueOnce({ docs: [latest] })

    await expect(getSelectedOffering(7, 42)).resolves.toBe(latest)
    expect(find).toHaveBeenCalledTimes(2)
  })
})
