import type { Admin, Course, CourseVersion, Member } from "@repo/shared/payload-types"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import {
  getCoursesTableData,
  getMyCoursesSummary,
  getMyDraftCourses,
  getMyDraftOfferings,
  getPublishedCourse,
  getPublishedOfferings,
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
    period: "Semester 2 2026",
    startDate: "2026-07-20",
    endDate: "2026-11-06",
    name: "Capstone: Computer Science",
    teachingTeam: [],
    _status: "published",
    ...overrides,
  }) as CourseVersion

describe("getCoursesTableData", () => {
  beforeEach(() => {
    find.mockReset()
    vi.mocked(getPayloadClient).mockResolvedValue({
      find,
    } as unknown as Awaited<ReturnType<typeof getPayloadClient>>)
  })

  it("fetches every published course and offering, unpaginated, viewer-independent", async () => {
    find.mockResolvedValueOnce({ docs: [] }).mockResolvedValueOnce({ docs: [] })

    await getCoursesTableData()

    // Neither call passes a `user` - that's what keeps this cacheable across
    // every viewer, admins included. See the function's own doc comment.
    expect(find).toHaveBeenCalledWith({
      collection: "courses",
      depth: 1,
      overrideAccess: false,
      pagination: false,
      sort: "code",
    })
    expect(find).toHaveBeenCalledWith({
      collection: "courseVersions",
      depth: 1,
      overrideAccess: false,
      pagination: false,
      sort: ["-startDate", "-id"],
    })
  })

  it("pairs each course with its current offering, and summarizes the directory", async () => {
    const auckland = course({ id: 1, code: "COMPSCI 399" })
    const otago = course({
      id: 2,
      code: "COSC 345",
      institution: { id: 2, name: "University of Otago" },
    })
    const past = version({ id: 1, course: 1, period: "Semester 1 2025", startDate: "2025-02-01" })
    const current = version({ id: 2, course: 1, period: "Full Year 2026", startDate: "2026-03-02" })
    const next = version({
      id: 3,
      course: 1,
      period: "Full Year 2027",
      startDate: "2027-03-01",
      endDate: "2027-11-05",
    })

    find
      .mockResolvedValueOnce({ docs: [auckland, otago] })
      // Already sorted newest first, as the real query would return them.
      .mockResolvedValueOnce({ docs: [next, current, past] })

    const { rows, summary } = await getCoursesTableData("2026-08-01")

    expect(rows).toEqual([
      expect.objectContaining({
        id: "1",
        code: "COMPSCI 399",
        currentOffering: "Full Year 2026",
        offerings: 3,
      }),
      expect.objectContaining({
        id: "2",
        code: "COSC 345",
        title: "No offering yet",
        offerings: 0,
      }),
    ])
    expect(summary.totalCourses).toBe(2)
    expect(summary.yearLongCourses).toBe(1)
  })
})

describe("getMyCoursesSummary", () => {
  // Uses the real current year instead of hardcoding one - `summarizeMyCourses`
  // defaults "up to date" to the current year, so a fixed value here would
  // go stale over time.
  const currentYear = new Date().getFullYear()
  const rows = [
    {
      id: "1",
      code: "COMPSCI 399",
      title: "Capstone",
      lecturer: "A. Patel",
      university: "UoA",
      currentOffering: `Semester 2 ${currentYear}`,
      currentStartDate: `${currentYear}-07-20`,
      offerings: 1,
      status: "published" as const,
    },
  ]

  beforeEach(() => {
    find.mockReset()
    vi.mocked(getPayloadClient).mockResolvedValue({
      find,
    } as unknown as Awaited<ReturnType<typeof getPayloadClient>>)
  })

  it("returns null when nobody's signed in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })

    expect(await getMyCoursesSummary(rows)).toBeNull()
    expect(find).not.toHaveBeenCalled()
  })

  it("returns null for an admin, rather than matching their id against an unrelated member's courses", async () => {
    // Admins and members are separate collections with their own id sequences,
    // so an admin with id 1 has nothing to do with the member id 1 who owns rows[0].
    const admin = { id: 1 } as Admin
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: "admin", user: admin })

    expect(await getMyCoursesSummary(rows)).toBeNull()
    expect(find).not.toHaveBeenCalled()
  })

  it("scopes the owned-course lookup to the signed-in member", async () => {
    const member = { id: 1 } as Member
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: "members", user: member })
    find.mockResolvedValueOnce({ docs: [{ id: 1 }] })

    await getMyCoursesSummary(rows)

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "courses",
        where: { owner: { equals: 1 } },
        overrideAccess: false,
        user: member,
      }),
    )
  })

  it("summarizes the member's owned courses against the given rows", async () => {
    const member = { id: 1 } as Member
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: "members", user: member })
    find.mockResolvedValueOnce({ docs: [{ id: 1 }] })

    expect(await getMyCoursesSummary(rows)).toEqual({ total: 1, upToDate: 1, year: currentYear })
  })
})

describe("getMyDraftCourses", () => {
  const member = { id: 1 } as Member

  beforeEach(() => {
    find.mockReset()
    vi.mocked(getPayloadClient).mockResolvedValue({
      find,
    } as unknown as Awaited<ReturnType<typeof getPayloadClient>>)
  })

  it("returns nothing, and queries nothing, when nobody's signed in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: null, user: null })

    expect(await getMyDraftCourses()).toEqual({ editable: {}, rows: [] })
    expect(find).not.toHaveBeenCalled()
  })

  it("returns nothing for an admin, whose id could match an unrelated member's", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: "admin", user: { id: 1 } as Admin })

    expect(await getMyDraftCourses()).toEqual({ editable: {}, rows: [] })
    expect(find).not.toHaveBeenCalled()
  })

  it("looks up only the member's own never-published courses, as the member", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: "members", user: member })
    find.mockResolvedValueOnce({ docs: [course({ id: 4 })] }).mockResolvedValueOnce({ docs: [] })

    await getMyDraftCourses()

    expect(find).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        collection: "courses",
        where: {
          and: [
            { hasPublishedVersion: { not_equals: true } },
            { or: [{ owner: { equals: 1 } }, { editors: { contains: 1 } }] },
          ],
        },
        overrideAccess: false,
        user: member,
      }),
    )
    expect(find).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        collection: "courseVersions",
        where: { course: { in: [4] } },
        // A draft saved over an offering only writes a revision, so the
        // collection row alone would show the offering as first created.
        draft: true,
        overrideAccess: false,
        user: member,
      }),
    )
  })

  it("skips the offerings lookup when the member has no drafts", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: "members", user: member })
    find.mockResolvedValueOnce({ docs: [] })

    expect(await getMyDraftCourses()).toEqual({ editable: {}, rows: [] })
    expect(find).toHaveBeenCalledTimes(1)
  })

  it("turns each draft course into a draft row using its newest offering", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: "members", user: member })
    const newer = version({
      id: 2,
      course: 4,
      name: "Newer draft",
      period: "Semester 2 2026",
      _status: "draft",
    })
    const older = version({ id: 1, course: 4, name: "Older draft", _status: "draft" })
    find
      .mockResolvedValueOnce({ docs: [course({ id: 4, code: "COSC 345" })] })
      .mockResolvedValueOnce({ docs: [newer, older] })

    const { rows } = await getMyDraftCourses()
    expect(rows).toEqual([
      expect.objectContaining({
        id: "4",
        code: "COSC 345",
        title: "Newer draft",
        status: "draft",
        currentOffering: "Semester 2 2026",
        offerings: 2,
      }),
    ])
  })

  it("pre-fills each draft's dialog values from its newest offering and the member's position", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      user: { ...member, position: "Senior Lecturer" } as Member,
    })
    const draft = version({
      id: 9,
      course: 4,
      name: "Capstone",
      period: "Semester 2 2026",
      startDate: "2026-07-20T00:00:00.000Z",
      endDate: "2026-11-06T00:00:00.000Z",
      programme: null,
      _status: "draft",
    })
    find
      .mockResolvedValueOnce({ docs: [course({ id: 4, code: "COSC 345" })] })
      .mockResolvedValueOnce({ docs: [draft] })

    const { editable } = await getMyDraftCourses()

    expect(editable).toEqual({
      "4": {
        canDelete: true,
        courseId: 4,
        versionId: 9,
        values: {
          additionalInfo: null,
          assessments: null,
          code: "COSC 345",
          deliveryFormat: "",
          endDate: "2026-11-06",
          learningOutcomes: null,
          name: "Capstone",
          period: "Semester 2 2026",
          programme: "",
          projectType: "",
          role: "Senior Lecturer",
          startDate: "2026-07-20",
        },
      },
    })
  })

  it("lets only the owner delete a draft, not an editor", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      collection: "members",
      user: { id: 7 } as Member,
    })
    find
      .mockResolvedValueOnce({ docs: [course({ id: 4, editors: [7] })] })
      .mockResolvedValueOnce({ docs: [version({ id: 9, course: 4, _status: "draft" })] })

    const { editable } = await getMyDraftCourses()

    expect(editable["4"]?.canDelete).toBe(false)
  })

  it("leaves out a draft course with no offering, which would have nothing to open", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: "members", user: member })
    find.mockResolvedValueOnce({ docs: [course({ id: 4 })] }).mockResolvedValueOnce({ docs: [] })

    expect(await getMyDraftCourses()).toEqual({ editable: {}, rows: [] })
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

describe("getMyDraftOfferings", () => {
  const member = { id: 1 } as Member

  it("returns nothing, and queries nothing, for an admin", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: "admin", user: { id: 1 } as Admin })

    expect(await getMyDraftOfferings(7)).toEqual([])
    expect(find).not.toHaveBeenCalled()
  })

  it("reads each offering's newest save as the member", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: "members", user: member })

    await getMyDraftOfferings(7)

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "courseVersions",
        where: { course: { equals: 7 } },
        draft: true,
        overrideAccess: false,
        user: member,
      }),
    )
  })

  it("keeps only offerings that have never been published", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: "members", user: member })
    find.mockResolvedValue({
      docs: [
        { id: 3, _status: "draft" },
        { id: 2, _status: "published", publishedAt: "2026-07-01T00:00:00.000Z" },
        // A pending edit over a published offering, which only the admin can make.
        { id: 1, _status: "draft", publishedAt: "2026-03-01T00:00:00.000Z" },
      ],
    })

    expect((await getMyDraftOfferings(7)).map((offering) => offering.id)).toEqual([3])
  })
})
