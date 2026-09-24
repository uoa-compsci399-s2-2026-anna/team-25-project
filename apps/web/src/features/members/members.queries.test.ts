import { InstitutionCountry } from "@repo/shared/enums/institutions"
import { cacheTag } from "next/cache"
import { connection } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import {
  countMembers,
  getMemberCounts,
  getMemberCourses,
  getMemberCoursesCached,
  getMemberCoursesConvenedCount,
  getMemberCoursesConvenedCountCached,
  getMemberDetails,
  getMemberDetailsCached,
  getMemberProposals,
  getMemberProposalsCached,
  getMembers,
} from "./members.queries"

vi.mock("@/lib/payload/getPayloadClient", () => ({ getPayloadClient: vi.fn() }))
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))
// The real one throws outside a request scope, which a unit test has no way to enter.
vi.mock("next/server", () => ({ connection: vi.fn() }))

const find = vi.fn()
const count = vi.fn()

const selectedFields = {
  avatar: true,
  firstName: true,
  institution: true,
  lastName: true,
  position: true,
}

beforeEach(() => {
  find.mockReset().mockResolvedValue({ docs: [] })
  count.mockReset().mockResolvedValue({ totalDocs: 0 })
  vi.mocked(cacheTag).mockReset()
  vi.mocked(connection).mockClear()
  vi.mocked(getPayloadClient).mockResolvedValue({ count, find } as unknown as Awaited<
    ReturnType<typeof getPayloadClient>
  >)
})
describe("request-time deferral", () => {
  // Without it, cacheComponents prerenders the query and trips over Payload's transaction id.
  it("defers to request time before querying", async () => {
    count.mockResolvedValue({ totalDocs: 0 })

    await getMembers({ country: InstitutionCountry.NZ }, { limit: 12, page: 1 })
    expect(connection).toHaveBeenCalledOnce()

    vi.mocked(connection).mockClear()
    await countMembers({})
    expect(connection).toHaveBeenCalledOnce()
  })
})

describe("getMembers", () => {
  it("applies every member filter", async () => {
    await getMembers(
      {
        country: InstitutionCountry.NZ,
        institutionId: 12,
        search: "  tui  ",
        sort: "surnameDesc",
      },
      { limit: 12, page: 2 },
    )

    expect(find).toHaveBeenCalledWith({
      collection: "members",
      depth: 1,
      limit: 12,
      page: 2,
      select: selectedFields,
      sort: ["-lastName", "id"],
      where: {
        and: [{ or: [{ firstName: { contains: "tui" } }, { lastName: { contains: "tui" } }] }],
        institution: { equals: 12 },
        "institution.country": { equals: InstitutionCountry.NZ },
      },
    })
  })

  it("returns the whole directory by surname when no filters are set", async () => {
    await getMembers({}, { limit: 12, page: 1 })

    expect(find).toHaveBeenCalledWith({
      collection: "members",
      depth: 1,
      limit: 12,
      page: 1,
      select: selectedFields,
      sort: ["lastName", "id"],
      where: {},
    })
  })

  it("matches one search term against either name", async () => {
    await getMembers({ search: "anna" }, { limit: 12, page: 1 })

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          and: [{ or: [{ firstName: { contains: "anna" } }, { lastName: { contains: "anna" } }] }],
        },
      }),
    )
  })

  it("requires every word of a full name to match, across the two fields", async () => {
    await getMembers({ search: "Priya  Nair" }, { limit: 12, page: 1 })

    // One `contains` over the whole string can never match, since neither field holds both words.
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          and: [
            { or: [{ firstName: { contains: "Priya" } }, { lastName: { contains: "Priya" } }] },
            { or: [{ firstName: { contains: "Nair" } }, { lastName: { contains: "Nair" } }] },
          ],
        },
      }),
    )
  })

  // Without a tiebreaker, equal surnames can land a member on two pages or none.
  it.each([
    ["surnameAsc", ["lastName", "id"]],
    ["surnameDesc", ["-lastName", "id"]],
  ] as const)("breaks ties on id when sorting %s", async (sort, expected) => {
    await getMembers({ sort }, { limit: 12, page: 1 })

    expect(find).toHaveBeenCalledWith(expect.objectContaining({ sort: expected }))
  })

  it("asks only for the fields the card draws, leaving gated ones behind", async () => {
    await getMembers({}, { limit: 12, page: 1 })

    const { select } = find.mock.lastCall?.[0] ?? {}
    expect(select).toEqual(selectedFields)
    expect(select).not.toHaveProperty("email")
    expect(select).not.toHaveProperty("bio")
  })
})

describe("countMembers", () => {
  it("counts through the same filters the list uses", async () => {
    count.mockResolvedValue({ totalDocs: 13 })

    await expect(countMembers({ country: InstitutionCountry.NZ })).resolves.toBe(13)
    expect(count).toHaveBeenCalledWith({
      collection: "members",
      where: { "institution.country": { equals: InstitutionCountry.NZ } },
    })
  })
})

describe("getMemberCounts", () => {
  it("counts the filtered members against the whole directory", async () => {
    count.mockResolvedValueOnce({ totalDocs: 8 }).mockResolvedValueOnce({ totalDocs: 124 })

    await expect(getMemberCounts({ country: InstitutionCountry.NZ })).resolves.toEqual({
      shown: 8,
      total: 124,
    })

    expect(count).toHaveBeenNthCalledWith(1, {
      collection: "members",
      where: { "institution.country": { equals: InstitutionCountry.NZ } },
    })
    // The total is the same count with nothing filtering it.
    expect(count).toHaveBeenNthCalledWith(2, { collection: "members", where: {} })
  })

  it("reports the same number twice when nothing is filtered", async () => {
    count.mockResolvedValue({ totalDocs: 124 })

    await expect(getMemberCounts({})).resolves.toEqual({ shown: 124, total: 124 })
  })
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
      select: { course: true, period: true, name: true, displaySnapshot: { courseCode: true } },
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
