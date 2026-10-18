import type { Admin, Course, CourseVersion, Member } from "@repo/shared/payload-types"
import { connection } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import {
  getCoursesTableData,
  getMyCoursesSummary,
  getMyDraftCourses,
  getPublishedCourse,
  getPublishedOfferings,
  resolveCourseOffering,
} from "./courses.queries"

vi.mock("@/lib/payload/getPayloadClient", () => ({ getPayloadClient: vi.fn() }))
vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))
vi.mock("next/server", () => ({ connection: vi.fn(async () => {}) }))

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
    term: "semester2",
    year: 2026,
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

    await getCoursesTableData(new Date("2026-08-01"))

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

  it("pairs each course with its most recently started offering, and summarizes the directory", async () => {
    const auckland = course({ id: 1, code: "COMPSCI 399" })
    const otago = course({
      id: 2,
      code: "COSC 345",
      institution: { id: 2, name: "University of Otago" },
    })
    const older = version({
      id: 1,
      course: 1,
      term: "semester1",
      year: 2025,
      startDate: "2025-02-01",
    })
    const newer = version({
      id: 2,
      course: 1,
      term: "fullYear",
      year: 2026,
      startDate: "2026-07-20",
    })

    find
      .mockResolvedValueOnce({ docs: [auckland, otago] })
      // Already sorted newest first, as the real query would return them.
      .mockResolvedValueOnce({ docs: [newer, older] })

    const { rows, summary } = await getCoursesTableData(new Date("2026-08-01"))

    expect(rows).toEqual([
      expect.objectContaining({ id: "1", code: "COMPSCI 399", year: 2026, semester: "Full Year" }),
      expect.objectContaining({ id: "2", code: "COSC 345", title: "No offering yet" }),
    ])
    expect(summary.totalCourses).toBe(2)
    expect(summary.yearLongCourses).toBe(1)
  })

  it("carries every offering of a course, newest first, for the period filters", async () => {
    const older = version({ id: 1, course: 1, term: "semester1", year: 2025 })
    const newer = version({ id: 2, course: 1, term: "semester2", year: 2026 })
    find
      .mockResolvedValueOnce({ docs: [course({ id: 1 }), course({ id: 2 })] })
      .mockResolvedValueOnce({ docs: [newer, older] })

    const { rows } = await getCoursesTableData(new Date("2026-08-01"))

    expect(rows[0]?.offerings).toEqual([
      expect.objectContaining({ offeringId: 2, semester: "Semester 2", year: 2026 }),
      expect.objectContaining({ offeringId: 1, semester: "Semester 1", year: 2025 }),
    ])
    // A course with no published offering still gets a list, just an empty one.
    expect(rows[1]?.offerings).toEqual([])
  })

  // Publishing next year's offering early mustn't hide the one being taught now.
  it("shows the started offering rather than an upcoming one, which still rides along", async () => {
    const upcoming = version({
      id: 3,
      course: 1,
      name: "Next year",
      term: "semester1",
      year: 2027,
      startDate: "2027-03-01",
      endDate: "2027-06-30",
    })
    const started = version({ id: 2, course: 1, name: "This year", startDate: "2026-07-20" })
    find
      .mockResolvedValueOnce({ docs: [course({ id: 1 })] })
      .mockResolvedValueOnce({ docs: [upcoming, started] })

    const { rows } = await getCoursesTableData(new Date("2026-08-01"))

    expect(rows[0]).toEqual(
      expect.objectContaining({ title: "This year", semester: "Semester 2", year: 2026 }),
    )
    expect(rows[0]?.offerings?.map((offering) => offering.offeringId)).toEqual([3, 2])
  })

  it("shows the soonest upcoming offering when none has started", async () => {
    const later = version({ id: 3, course: 1, name: "Later", startDate: "2027-07-20" })
    const sooner = version({ id: 2, course: 1, name: "Sooner", startDate: "2027-03-01" })
    find
      .mockResolvedValueOnce({ docs: [course({ id: 1 })] })
      .mockResolvedValueOnce({ docs: [later, sooner] })

    const { rows } = await getCoursesTableData(new Date("2026-08-01"))

    expect(rows[0]?.title).toBe("Sooner")
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
      semester: "Semester 2",
      year: currentYear,
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
        year: 2026,
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
          programme: "",
          projectType: "",
          role: "Senior Lecturer",
          startDate: "2026-07-20",
          term: "semester2",
          year: "2026",
        },
      },
    })
  })

  // A draft may not have picked its term or year yet; the dialog shows those as blank.
  it("pre-fills a draft without a term or year as blank", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ collection: "members", user: member })
    const draft = version({ id: 9, course: 4, term: null, year: null, _status: "draft" })
    find
      .mockResolvedValueOnce({ docs: [course({ id: 4 })] })
      .mockResolvedValueOnce({ docs: [draft] })

    const { editable, rows } = await getMyDraftCourses()

    expect(editable["4"]?.values).toEqual(expect.objectContaining({ term: "", year: "" }))
    expect(rows[0]).toEqual(expect.objectContaining({ semester: "—", year: 0 }))
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

describe("resolveCourseOffering", () => {
  const started = { id: 2, startDate: "2020-02-01", endDate: "2020-06-30" }
  const upcoming = { id: 3, startDate: "2999-02-01", endDate: "2999-06-30" }

  // As the page hands them over: route params and search params, both promises.
  const resolve = (offering?: string) =>
    resolveCourseOffering(
      Promise.resolve({ courseId: "7" }),
      Promise.resolve(offering ? { offering } : {}),
    )

  it("reads the course's published offerings once, newest period first", async () => {
    await resolve()

    expect(find).toHaveBeenCalledOnce()
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ where: publishedOfferings, sort: NEWEST_FIRST }),
    )
  })

  // Picking the current offering depends on today, so it must wait for the request.
  it("defers the pick to request time", async () => {
    vi.mocked(connection).mockClear()
    await resolve()

    expect(connection).toHaveBeenCalled()
  })

  it("selects the current offering when none is requested", async () => {
    find.mockResolvedValue({ docs: [upcoming, started] })

    await expect(resolve()).resolves.toEqual({
      courseId: 7,
      now: expect.any(Date),
      offerings: [upcoming, started],
      selected: started,
      current: started,
    })
  })

  it("selects the requested offering when the course has it", async () => {
    find.mockResolvedValue({ docs: [upcoming, started] })

    await expect(resolve("3")).resolves.toMatchObject({ selected: upcoming, current: started })
  })

  it("falls back to the current offering when the requested one isn't the course's", async () => {
    find.mockResolvedValue({ docs: [upcoming, started] })

    await expect(resolve("42")).resolves.toMatchObject({ selected: started })
  })

  // nuqs drops a value parseAsPositiveInteger rejects, so it reads as no request.
  it("ignores an offering id that isn't a positive integer", async () => {
    find.mockResolvedValue({ docs: [upcoming, started] })

    await expect(resolve("3abc")).resolves.toMatchObject({ selected: started })
  })

  it("selects nothing for a course with no published offerings", async () => {
    await expect(resolve()).resolves.toMatchObject({
      offerings: [],
      selected: undefined,
      current: undefined,
    })
  })
})
