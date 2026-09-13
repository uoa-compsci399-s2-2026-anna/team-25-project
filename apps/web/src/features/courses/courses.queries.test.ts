import type { Course, CourseVersion, Member } from "@repo/shared/payload-types"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import {
  getCoursesPageData,
  getLatestPublishedOffering,
  getPublishedCourse,
  getPublishedOffering,
  getPublishedOfferings,
  getSelectedOffering,
} from "./courses.queries"

vi.mock("@/lib/payload/getPayloadClient", () => ({ getPayloadClient: vi.fn() }))
vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))
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

const course = (overrides: Record<string, unknown>): Course =>
  ({
    id: 1,
    code: "COMPSCI 399",
    institution: { id: 1, name: "University of Auckland" },
    owner: { id: 1, firstName: "Arohan", lastName: "Patel" },
    ...overrides,
  }) as Course

const version = (overrides: Partial<CourseVersion>): CourseVersion =>
  ({
    id: 1,
    period: "2026 Semester 2",
    startDate: "2026-07-20",
    endDate: "2026-11-06",
    name: "Capstone: Computer Science",
    teachingTeam: [],
    _status: "published",
    ...overrides,
  }) as CourseVersion

describe("getCoursesPageData", () => {
  beforeEach(() => {
    find.mockReset()
    vi.mocked(getPayloadClient).mockResolvedValue({
      find,
    } as unknown as Awaited<ReturnType<typeof getPayloadClient>>)
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })
  })

  it("fetches every visible course and offering, unpaginated and access-controlled", async () => {
    find.mockResolvedValueOnce({ docs: [] }).mockResolvedValueOnce({ docs: [] })

    await getCoursesPageData()

    expect(find).toHaveBeenCalledWith({
      collection: "courses",
      depth: 1,
      overrideAccess: false,
      pagination: false,
      sort: "code",
      user: undefined,
    })
    expect(find).toHaveBeenCalledWith({
      collection: "courseVersions",
      depth: 1,
      overrideAccess: false,
      pagination: false,
      sort: ["-startDate", "-id"],
      user: undefined,
    })
  })

  it("scopes both queries to the signed-in viewer, so their own drafts are included", async () => {
    const member = { collection: "members", id: 7 } as unknown as Member
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: "members", user: member })
    find.mockResolvedValueOnce({ docs: [] }).mockResolvedValueOnce({ docs: [] })

    await getCoursesPageData()

    expect(find).toHaveBeenCalledWith(expect.objectContaining({ user: member }))
  })

  it("pairs each course with its most recently started offering, and summarizes the directory", async () => {
    const auckland = course({ id: 1, code: "COMPSCI 399" })
    const otago = course({
      id: 2,
      code: "COSC 345",
      institution: { id: 2, name: "University of Otago" },
    })
    const older = version({ id: 1, course: 1, period: "2025 Semester 1", startDate: "2025-02-01" })
    const newer = version({ id: 2, course: 1, period: "2026 Full Year", startDate: "2026-07-20" })

    find
      .mockResolvedValueOnce({ docs: [auckland, otago] })
      // Already sorted newest first, as the real query would return them.
      .mockResolvedValueOnce({ docs: [newer, older] })

    const { rows, summary, myCourses } = await getCoursesPageData()

    expect(rows).toEqual([
      expect.objectContaining({ id: "1", code: "COMPSCI 399", year: 2026, semester: "Full Year" }),
      expect.objectContaining({ id: "2", code: "COSC 345", title: "No offering yet" }),
    ])
    expect(summary.totalCourses).toBe(2)
    expect(summary.yearLongCourses).toBe(1)
    expect(myCourses).toBeNull()
  })

  it("summarizes the signed-in viewer's own courses", async () => {
    // Built from the real current year, not a hardcoded one: `summarizeMyCourses`
    // defaults "up to date" to "has an offering for the current year", so a
    // fixed year would silently go stale the moment this test outlives it.
    const currentYear = new Date().getFullYear()
    const me = { collection: "members", id: 1 } as unknown as Member
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: "members", user: me })

    const mine = course({
      id: 1,
      code: "COMPSCI 399",
      owner: { id: 1, firstName: "A", lastName: "B" },
    })
    const someoneElses = course({
      id: 2,
      code: "COSC 345",
      owner: { id: 2, firstName: "C", lastName: "D" },
    })
    const myOffering = version({
      id: 1,
      course: 1,
      period: `${currentYear} Semester 2`,
      startDate: `${currentYear}-07-20`,
    })

    find
      .mockResolvedValueOnce({ docs: [mine, someoneElses] })
      .mockResolvedValueOnce({ docs: [myOffering] })

    const { myCourses } = await getCoursesPageData()

    expect(myCourses).toEqual({ total: 1, upToDate: 1, year: currentYear })
  })
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
