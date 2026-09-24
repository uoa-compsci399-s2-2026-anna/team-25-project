import { cacheTag } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import {
  getMemberCourses,
  getMemberCoursesCached,
  getMemberCoursesConvenedCount,
  getMemberCoursesConvenedCountCached,
  getMemberDetails,
  getMemberDetailsCached,
  getMemberProposals,
  getMemberProposalsCached,
} from "./member.queries"

vi.mock("@/lib/payload/getPayloadClient", () => ({ getPayloadClient: vi.fn() }))
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))

const find = vi.fn()
const count = vi.fn()

beforeEach(() => {
  find.mockReset().mockResolvedValue({ docs: [] })
  count.mockReset().mockResolvedValue({ totalDocs: 0 })
  vi.mocked(cacheTag).mockReset()
  vi.mocked(getPayloadClient).mockResolvedValue({
    find,
    count,
  } as unknown as Awaited<ReturnType<typeof getPayloadClient>>)
})

describe("getMemberDetails", () => {
  it("reads one member by id with its relationships populated", async () => {
    await getMemberDetails(7)

    expect(find).toHaveBeenCalledWith({
      collection: "members",
      where: { id: { equals: 7 } },
      depth: 1,
      limit: 1,
      pagination: false,
    })
  })

  it("returns the member when found", async () => {
    find.mockResolvedValue({ docs: [{ id: 7 }] })
    await expect(getMemberDetails(7)).resolves.toEqual({ id: 7 })
  })

  it("returns null when no member matches", async () => {
    await expect(getMemberDetails(7)).resolves.toBeNull()
  })

  it("is cached under the member's own tag", async () => {
    find.mockResolvedValue({ docs: [{ id: 7 }] })
    await expect(getMemberDetailsCached(7)).resolves.toEqual({ id: 7 })
    expect(cacheTag).toHaveBeenCalledWith("member:7")
  })
})

describe("getMemberProposals", () => {
  it("reads every proposal the member authored, newest first", async () => {
    await getMemberProposals(7)

    expect(find).toHaveBeenCalledWith({
      collection: "proposals",
      where: { author: { contains: 7 } },
      sort: "-createdAt",
      depth: 0,
      pagination: false,
      select: { title: true, proposalSlug: true, summary: true, status: true, createdAt: true },
    })
  })

  it("returns the proposals", async () => {
    const docs = [{ id: 2 }, { id: 1 }]
    find.mockResolvedValue({ docs })
    await expect(getMemberProposals(7)).resolves.toEqual(docs)
  })

  it("is cached under the proposals tag", async () => {
    await expect(getMemberProposalsCached(7)).resolves.toEqual([])
    expect(cacheTag).toHaveBeenCalledWith("proposals")
  })
})

describe("getMemberCoursesConvenedCount", () => {
  it("counts the courses the member owns", async () => {
    count.mockResolvedValue({ totalDocs: 3 })

    await expect(getMemberCoursesConvenedCount(7)).resolves.toBe(3)
    expect(count).toHaveBeenCalledWith({
      collection: "courses",
      where: { owner: { equals: 7 } },
    })
  })

  it("is cached under the courses tag", async () => {
    await expect(getMemberCoursesConvenedCountCached(7)).resolves.toBe(0)
    expect(cacheTag).toHaveBeenCalledWith("courses")
  })
})

describe("getMemberCourses", () => {
  it("reads published offerings of the member's courses, newest first", async () => {
    await getMemberCourses(7)

    expect(find).toHaveBeenCalledWith({
      collection: "courseVersions",
      where: {
        and: [{ "course.owner": { equals: 7 } }, { _status: { equals: "published" } }],
      },
      sort: ["-startDate", "-id"],
      depth: 0,
      pagination: false,
      select: { course: true, period: true, name: true, displaySnapshot: true },
    })
  })

  it("keeps only the newest offering of each course", async () => {
    find.mockResolvedValue({
      docs: [
        {
          course: 1,
          period: "2026 Semester 2",
          name: "Capstone",
          displaySnapshot: { courseCode: "COMPSCI 399" },
        },
        {
          course: 1,
          period: "2025 Semester 2",
          name: "Old capstone",
          displaySnapshot: { courseCode: "COMPSCI 399" },
        },
        {
          course: { id: 2 },
          period: "2026 Semester 1",
          name: "Design",
          displaySnapshot: { courseCode: "SOFTENG 206" },
        },
      ],
    })

    await expect(getMemberCourses(7)).resolves.toEqual([
      { courseId: 1, code: "COMPSCI 399", name: "Capstone", period: "2026 Semester 2" },
      { courseId: 2, code: "SOFTENG 206", name: "Design", period: "2026 Semester 1" },
    ])
  })

  it("leaves code and name empty when the offering has none", async () => {
    find.mockResolvedValue({
      docs: [
        { course: 1, period: "2026 Semester 2" },
        { course: 2, period: "2026 Semester 1", name: null, displaySnapshot: {} },
      ],
    })

    await expect(getMemberCourses(7)).resolves.toEqual([
      { courseId: 1, code: null, name: null, period: "2026 Semester 2" },
      { courseId: 2, code: null, name: null, period: "2026 Semester 1" },
    ])
  })

  it("is cached under the courses tag", async () => {
    await expect(getMemberCoursesCached(7)).resolves.toEqual([])
    expect(cacheTag).toHaveBeenCalledWith("courses")
  })
})
