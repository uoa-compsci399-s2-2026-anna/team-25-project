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
  getMemberDetails,
  getMemberDetailsCached,
  getMemberProposals,
  getMemberProposalsCached,
  getMemberPublications,
  getMemberPublicationsCached,
  getMemberResources,
  getMemberResourcesCached,
  getMemberSitemapEntries,
  getMemberSitemapEntriesCached,
  getMembers,
  getResearchInterestOptions,
  loadMemberCount,
  loadMembersPage,
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
  researchInterests: true,
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
describe("loadMembersPage", () => {
  it("serves a view without free text from the cache, tagged with the members and institutions", async () => {
    // The page always sends interests, as [] when none are picked.
    await loadMembersPage(
      { country: InstitutionCountry.NZ, researchInterests: [] },
      { limit: 12, page: 1 },
    )

    expect(cacheTag).toHaveBeenCalledWith("members", "institutions")
    expect(connection).not.toHaveBeenCalled()
  })

  // Without connection(), cacheComponents prerenders the query and trips over Payload's random join alias.
  it.each([{ search: "anna" }, { researchInterests: ["Generative AI"] }])(
    "defers %o to request time and skips the cache",
    async (filters) => {
      await loadMembersPage(filters, { limit: 12, page: 1 })

      expect(connection).toHaveBeenCalledOnce()
      expect(cacheTag).not.toHaveBeenCalled()
      expect(find).toHaveBeenCalledOnce()
    },
  )
})

describe("loadMemberCount", () => {
  it("serves a count without free text from the cache", async () => {
    await loadMemberCount({ institutionId: 2, researchInterests: [] })

    expect(cacheTag).toHaveBeenCalledWith("members", "institutions")
    expect(connection).not.toHaveBeenCalled()
  })

  it("defers a searched count to request time and skips the cache", async () => {
    await loadMemberCount({ search: "anna" })

    expect(connection).toHaveBeenCalledOnce()
    expect(cacheTag).not.toHaveBeenCalled()
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

  it("matches any of the chosen interests, each exactly as stored", async () => {
    await getMembers({ researchInterests: ["Generative AI"] }, { limit: 12, page: 1 })

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { researchInterests: { in: ["Generative AI"] } } }),
    )
  })

  it("asks only for the fields the card draws, leaving gated ones behind", async () => {
    await getMembers({}, { limit: 12, page: 1 })

    const { select } = find.mock.lastCall?.[0] ?? {}
    expect(select).toEqual(selectedFields)
    expect(select).not.toHaveProperty("email")
    expect(select).not.toHaveProperty("bio")
  })
})

describe("getResearchInterestOptions", () => {
  const withInterests = (...researchInterests: (string[] | null)[]) =>
    find.mockResolvedValue({ docs: researchInterests.map((r) => ({ researchInterests: r })) })

  it("offers each distinct interest once, alphabetically", async () => {
    withInterests(["Teamwork", "Assessment"], ["Assessment"], ["Generative AI"])

    await expect(getResearchInterestOptions()).resolves.toEqual([
      { label: "Assessment", value: "Assessment" },
      { label: "Generative AI", value: "Generative AI" },
      { label: "Teamwork", value: "Teamwork" },
    ])
  })

  // Postgres compares these case-sensitively, so folding them into one option would hide
  // every member who spelled it the other way.
  it("keeps spellings that differ by case as separate options", async () => {
    withInterests(["Teamwork"], ["teamwork"])

    // Which of the two sorts first is down to the collator, so only membership is asserted.
    await expect(getResearchInterestOptions()).resolves.toEqual(
      expect.arrayContaining([
        { label: "Teamwork", value: "Teamwork" },
        { label: "teamwork", value: "teamwork" },
      ]),
    )
    await expect(getResearchInterestOptions()).resolves.toHaveLength(2)
  })

  it("offers an interest saved with surrounding spaces as its trimmed self, once", async () => {
    withInterests(["  Teamwork  "], ["Teamwork"])

    await expect(getResearchInterestOptions()).resolves.toEqual([
      { label: "Teamwork", value: "Teamwork" },
    ])
  })

  it("skips members with no interests, and blank entries", async () => {
    withInterests(null, [], ["   ", "Ethics"])

    await expect(getResearchInterestOptions()).resolves.toEqual([
      { label: "Ethics", value: "Ethics" },
    ])
  })

  it("reads only the interests, across every member", async () => {
    withInterests([])

    await getResearchInterestOptions()
    expect(find).toHaveBeenCalledWith({
      collection: "members",
      depth: 0,
      pagination: false,
      select: { researchInterests: true },
    })
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

  it("counts a search at request time but still takes the total from the cache", async () => {
    await getMemberCounts({ search: "anna" })

    expect(connection).toHaveBeenCalledOnce()
    expect(cacheTag).toHaveBeenCalledOnce()
    expect(cacheTag).toHaveBeenCalledWith("members", "institutions")
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

describe("getMemberSitemapEntries", () => {
  it("reads every member's id and update time", async () => {
    await getMemberSitemapEntries()

    expect(find).toHaveBeenCalledWith({
      collection: "members",
      depth: 0,
      pagination: false,
      select: { updatedAt: true },
    })
  })

  it("is cached under the members tag, so a new or deleted member updates the sitemap", async () => {
    find.mockResolvedValue({ docs: [{ id: 7, updatedAt: "2026-10-01T00:00:00.000Z" }] })
    await expect(getMemberSitemapEntriesCached()).resolves.toEqual([
      { id: 7, updatedAt: "2026-10-01T00:00:00.000Z" },
    ])
    expect(cacheTag).toHaveBeenCalledWith("members")
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

describe("getMemberPublications", () => {
  it("reads every publication the member is linked to as an author", async () => {
    await getMemberPublications(7)

    expect(find).toHaveBeenCalledWith({
      collection: "publications",
      where: { "authors.member": { equals: 7 } },
      sort: ["-year", "-month", "-id"],
      depth: 2,
      pagination: false,
      populate: { members: { avatar: true } },
    })
  })

  it("returns the publications", async () => {
    const docs = [{ id: 2 }, { id: 1 }]
    find.mockResolvedValue({ docs })
    await expect(getMemberPublications(7)).resolves.toEqual(docs)
  })

  it("is cached under the publications and members tags", async () => {
    await expect(getMemberPublicationsCached(7)).resolves.toEqual([])
    expect(cacheTag).toHaveBeenCalledWith("publications", "members", "member:7")
  })
})

describe("getMemberCourses", () => {
  it("reads published offerings of courses the member owns, edits or teaches, newest first", async () => {
    await getMemberCourses(7)

    expect(find).toHaveBeenCalledWith({
      collection: "courseVersions",
      where: {
        and: [
          {
            or: [
              { "course.owner": { equals: 7 } },
              { "course.editors": { contains: 7 } },
              { "teachingTeam.member": { equals: 7 } },
            ],
          },
          { _status: { equals: "published" } },
        ],
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

describe("getMemberResources", () => {
  it("reads every resource the member shared, newest first, with only what the cards draw", async () => {
    await getMemberResources(7)

    expect(find).toHaveBeenCalledWith({
      collection: "resources",
      depth: 1,
      pagination: false,
      populate: { courses: { code: true }, resourceAttachments: { filename: true } },
      select: { attachments: true, course: true, createdAt: true, title: true },
      sort: ["-createdAt", "-id"],
      where: { owner: { equals: 7 } },
    })
  })

  it("goes stale with resources and the courses whose codes the cards show", async () => {
    await getMemberResourcesCached(7)

    expect(cacheTag).toHaveBeenCalledWith("resources", "courses")
  })
})
