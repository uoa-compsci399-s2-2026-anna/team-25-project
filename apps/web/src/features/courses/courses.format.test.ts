import type { Course, CourseVersion, Member } from "@repo/shared/payload-types"
import { describe, expect, it } from "vitest"
import type { CourseTableRow } from "./components/CoursesTable"
import {
  deriveLecturer,
  deriveStatus,
  deriveTitle,
  deriveUniversity,
  findCurrentOffering,
  isCourseEditor,
  isCourseOwner,
  isTeachingStaff,
  type MyCoursesInput,
  offeringTiming,
  selectOffering,
  summarizeMyCourses,
  toCourseTableRow,
  toNewOfferingValues,
  toOfferingValues,
  toTeachingTeamRows,
} from "./courses.format"

const member = (overrides: Partial<Member> = {}): Member =>
  ({
    id: 1,
    firstName: "Arohan",
    lastName: "Patel",
    ...overrides,
  }) as Member

const course = (overrides: Partial<Course> = {}): Course =>
  ({
    id: 10,
    code: "COMPSCI 399",
    institution: { id: 1, name: "University of Auckland" },
    owner: member({ firstName: "Owner", lastName: "Fallback" }),
    ...overrides,
  }) as Course

const version = (overrides: Partial<CourseVersion> = {}): CourseVersion =>
  ({
    id: 100,
    course: 10,
    period: "Semester 2 2026",
    startDate: "2026-07-20",
    endDate: "2026-11-06",
    name: "Capstone: Computer Science",
    teachingTeam: [{ member: member(), role: "Course coordinator" }],
    _status: "published",
    ...overrides,
  }) as CourseVersion

describe("deriveTitle", () => {
  it("uses the offering's name", () => {
    expect(deriveTitle(version())).toBe("Capstone: Computer Science")
  })

  it("falls back when there's no offering yet", () => {
    expect(deriveTitle(undefined)).toBe("No offering yet")
  })

  it("falls back when the name is blank", () => {
    expect(deriveTitle(version({ name: "   " }))).toBe("No offering yet")
  })
})

describe("deriveStatus", () => {
  it("reads the offering's status", () => {
    expect(deriveStatus(version({ _status: "published" }))).toBe("published")
    expect(deriveStatus(version({ _status: "draft" }))).toBe("draft")
  })

  it("defaults to draft when there's no offering", () => {
    expect(deriveStatus(undefined)).toBe("draft")
  })
})

describe("deriveUniversity", () => {
  it("reads the populated institution's name", () => {
    expect(deriveUniversity(course())).toBe("University of Auckland")
  })

  it("falls back when the institution isn't populated", () => {
    expect(deriveUniversity(course({ institution: 1 }))).toBe("Unknown university")
  })
})

describe("deriveLecturer", () => {
  it("prefers the teaching team member marked as coordinator", () => {
    const coordinator = member({ firstName: "Maya", lastName: "Chen" })
    const row = version({
      teachingTeam: [
        { member: member({ firstName: "Noah", lastName: "Taylor" }), role: "Lecturer" },
        { member: coordinator, role: "Course coordinator" },
      ],
    })
    expect(deriveLecturer(row, course())).toBe("M. Chen")
  })

  it("falls back to the first teaching team member when no one is a coordinator", () => {
    const first = member({ firstName: "Noah", lastName: "Taylor" })
    const row = version({ teachingTeam: [{ member: first, role: "Lecturer" }] })
    expect(deriveLecturer(row, course())).toBe("N. Taylor")
  })

  it("falls back to the course owner when there's no teaching team", () => {
    const owner = member({ firstName: "Owner", lastName: "Fallback" })
    expect(deriveLecturer(version({ teachingTeam: [] }), course({ owner }))).toBe("O. Fallback")
    expect(deriveLecturer(undefined, course({ owner }))).toBe("O. Fallback")
  })

  it("falls back to 'Unassigned' when nothing is populated", () => {
    expect(deriveLecturer(undefined, course({ owner: 1 }))).toBe("Unassigned")
  })
})

describe("toCourseTableRow", () => {
  it("composes a full row from a course and its latest offering", () => {
    expect(toCourseTableRow(course(), version(), 1)).toEqual({
      id: "10",
      code: "COMPSCI 399",
      title: "Capstone: Computer Science",
      lecturer: "A. Patel",
      university: "University of Auckland",
      currentOffering: "Semester 2 2026",
      currentStartDate: "2026-07-20",
      offerings: 1,
      status: "published",
    })
  })

  it("composes a placeholder row for a course with no offering yet", () => {
    expect(toCourseTableRow(course(), undefined, 0)).toEqual({
      id: "10",
      code: "COMPSCI 399",
      title: "No offering yet",
      lecturer: "O. Fallback",
      university: "University of Auckland",
      currentOffering: "—",
      currentStartDate: "",
      offerings: 0,
      status: "draft",
    })
  })
})

const row = (overrides: Partial<CourseTableRow> = {}): CourseTableRow => ({
  id: "1",
  code: "COMP 693",
  title: "Capstone Project",
  lecturer: "A. Tui",
  university: "University of Auckland",
  currentOffering: "Semester 2 2026",
  currentStartDate: "2026-07-20",
  offerings: 1,
  status: "published",
  ...overrides,
})

describe("summarizeMyCourses", () => {
  const input = (overrides: Partial<MyCoursesInput> = {}): MyCoursesInput => ({
    memberId: 1,
    courses: [],
    rows: [],
    taughtOfferings: [],
    ownedOfferings: [],
    ...overrides,
  })
  const offering = (course: number, period: string, startDate: string) => ({
    course,
    period,
    startDate,
  })
  const codesOf = (summary: ReturnType<typeof summarizeMyCourses>) =>
    summary.courses.map((course) => course.code)

  it("lists published courses the viewer owns, edits or taught, with their relation", () => {
    const summary = summarizeMyCourses(
      input({
        courses: [
          { id: 1, owner: 1 },
          { id: 2, owner: 9 },
        ],
        rows: [
          row({ id: "1", code: "A 1" }),
          row({ id: "2", code: "B 2" }),
          row({ id: "3", code: "C 3" }),
          row({ id: "4", code: "D 4" }),
        ],
        taughtOfferings: [{ id: 30, course: 3, period: "Semester 1 2026" }],
      }),
      2026,
    )

    expect(summary.courses).toEqual([
      expect.objectContaining({ courseId: 1, isOwner: true, isEditor: false, taughtOfferings: [] }),
      expect.objectContaining({ courseId: 2, isOwner: false, isEditor: true }),
      expect.objectContaining({
        courseId: 3,
        isOwner: false,
        isEditor: false,
        taughtOfferings: [{ id: 30, period: "Semester 1 2026" }],
      }),
    ])
  })

  it("flags an owned course with no offering this year, but not an edited one", () => {
    const summary = summarizeMyCourses(
      input({
        courses: [
          { id: 1, owner: 1 },
          { id: 2, owner: 9 },
          { id: 3, owner: 1 },
        ],
        rows: [row({ id: "1" }), row({ id: "2" }), row({ id: "3" })],
        ownedOfferings: [
          offering(3, "Semester 2 2026", "2026-07-20"),
          offering(1, "Semester 2 2025", "2025-07-21"),
        ],
      }),
      2026,
    )

    expect(
      summary.courses.map((course) => [course.courseId, course.needsOfferingThisYear]),
    ).toEqual([
      [1, true],
      [3, false],
      [2, false],
    ])
  })

  it("checks every offering, not only the one the course is shown as", () => {
    // The table shows the 2027 offering as next, but one ran earlier in 2026.
    const summary = summarizeMyCourses(
      input({
        courses: [{ id: 1, owner: 1 }],
        rows: [row({ id: "1", currentStartDate: "2027-03-01" })],
        ownedOfferings: [
          offering(1, "Semester 1 2027", "2027-03-01"),
          offering(1, "Semester 1 2026", "2026-03-02"),
        ],
      }),
      2026,
    )

    expect(summary.courses[0]?.needsOfferingThisYear).toBe(false)
  })

  it("orders needing an offering, then owned, edited and only taught, each by code", () => {
    const summary = summarizeMyCourses(
      input({
        courses: [
          { id: 1, owner: 9 },
          { id: 2, owner: 1 },
          { id: 3, owner: 1 },
          { id: 4, owner: 1 },
        ],
        rows: [
          row({ id: "1", code: "EDITED" }),
          row({ id: "2", code: "OWNED B" }),
          row({ id: "3", code: "OWNED A" }),
          row({ id: "4", code: "STALE" }),
          row({ id: "5", code: "TAUGHT" }),
        ],
        taughtOfferings: [{ id: 50, course: 5, period: "Semester 1 2024" }],
        ownedOfferings: [
          offering(2, "Semester 2 2026", "2026-07-20"),
          offering(3, "Semester 2 2026", "2026-07-20"),
          offering(4, "Semester 2 2025", "2025-07-21"),
        ],
      }),
      2026,
    )

    expect(codesOf(summary)).toEqual(["STALE", "OWNED A", "OWNED B", "EDITED", "TAUGHT"])
  })
})

describe("findCurrentOffering", () => {
  const offering = (id: number, startDate: string, endDate: string) => ({ id, startDate, endDate })
  // Newest first, as the queries return them.
  const offerings = [
    offering(3, "2027-03-01", "2027-06-25"),
    offering(2, "2026-07-20", "2026-11-06"),
    offering(1, "2026-03-02", "2026-06-26"),
  ]

  it("picks the offering running today, and the one starting after it", () => {
    const { current, next, primary } = findCurrentOffering(offerings, "2026-08-01")
    expect(current?.id).toBe(2)
    expect(next?.id).toBe(3)
    expect(primary?.id).toBe(2)
  })

  it("counts the first and last days as running", () => {
    expect(findCurrentOffering(offerings, "2026-07-20").current?.id).toBe(2)
    expect(findCurrentOffering(offerings, "2026-11-06").current?.id).toBe(2)
  })

  it("shows the next offering between offerings", () => {
    const { current, primary } = findCurrentOffering(offerings, "2026-12-01")
    expect(current).toBeUndefined()
    expect(primary?.id).toBe(3)
  })

  it("falls back to the most recent offering once none are left", () => {
    const { current, next, primary } = findCurrentOffering(offerings, "2028-01-01")
    expect(current).toBeUndefined()
    expect(next).toBeUndefined()
    expect(primary?.id).toBe(3)
  })

  it("prefers the most recently started of two overlapping offerings", () => {
    const overlapping = [
      offering(5, "2026-07-20", "2026-11-06"),
      offering(4, "2026-03-02", "2026-11-06"),
    ]
    expect(findCurrentOffering(overlapping, "2026-08-01").current?.id).toBe(5)
  })
})

describe("selectOffering", () => {
  const offerings = [
    { id: 2, startDate: "2026-07-20", endDate: "2026-11-06" },
    { id: 1, startDate: "2026-03-02", endDate: "2026-06-26" },
  ]

  it("shows the requested offering", () => {
    const { offering, primary } = selectOffering(offerings, 1, "2026-08-01")
    expect(offering?.id).toBe(1)
    expect(primary?.id).toBe(2)
  })

  it("shows the current offering without a request", () => {
    expect(selectOffering(offerings, undefined, "2026-08-01").offering?.id).toBe(2)
  })

  // The page only passes the course's own offerings, so another course's ID misses here.
  it("falls back to the current offering for an ID that isn't one of the course's", () => {
    expect(selectOffering(offerings, 99, "2026-08-01").offering?.id).toBe(2)
  })
})

describe("offeringTiming", () => {
  const found = { current: { id: 2 }, next: { id: 3 } }

  it("labels the current and next offerings", () => {
    expect(
      offeringTiming(
        { id: 2, startDate: "2026-07-20", endDate: "2026-11-06" },
        found,
        "2026-08-01",
      ),
    ).toBe("current")
    expect(
      offeringTiming(
        { id: 3, startDate: "2027-03-01", endDate: "2027-06-18" },
        found,
        "2026-08-01",
      ),
    ).toBe("next")
  })

  it("labels the rest as past once ended, or future before they start", () => {
    expect(
      offeringTiming(
        { id: 1, startDate: "2026-03-02", endDate: "2026-06-19" },
        found,
        "2026-08-01",
      ),
    ).toBe("past")
    expect(
      offeringTiming(
        { id: 4, startDate: "2027-07-19", endDate: "2027-11-05" },
        found,
        "2026-08-01",
      ),
    ).toBe("future")
  })

  it("labels an offering still running under a newer, overlapping one as running", () => {
    expect(
      offeringTiming(
        { id: 1, startDate: "2026-02-23", endDate: "2026-11-06" },
        found,
        "2026-08-01",
      ),
    ).toBe("running")
  })
})

describe("isCourseEditor", () => {
  it("lets the owner and the course's editors edit, and no one else", () => {
    const shared = course({ owner: 1, editors: [2, member({ id: 3 })] })
    expect(isCourseEditor(shared, 1)).toBe(true)
    expect(isCourseEditor(shared, 2)).toBe(true)
    expect(isCourseEditor(shared, 3)).toBe(true)
    expect(isCourseEditor(shared, 4)).toBe(false)
  })
})

describe("toNewOfferingValues", () => {
  it("copies the offering's content but leaves its period and dates blank", () => {
    const values = toNewOfferingValues(version({ programme: "BSc", projectType: "Industry" }))
    expect(values).toMatchObject({
      name: "Capstone: Computer Science",
      programme: "BSc",
      projectType: "Industry",
      period: "",
      startDate: "",
      endDate: "",
    })
  })
})

describe("toOfferingValues", () => {
  it("keeps the offering's period and dates, as days for the date inputs", () => {
    expect(toOfferingValues(version({ startDate: "2026-07-20T00:00:00.000Z" }))).toMatchObject({
      period: "Semester 2 2026",
      startDate: "2026-07-20",
      endDate: "2026-11-06",
    })
  })
})

describe("course roles", () => {
  it("tells the owner apart from an editor", () => {
    const owned = course({ owner: 1, editors: [2] })
    expect(isCourseOwner(owned, 1)).toBe(true)
    expect(isCourseOwner(owned, 2)).toBe(false)
  })

  it("finds teaching staff by plain or populated member", () => {
    const offering = version({
      teachingTeam: [
        { member: 3, role: "Tutor" },
        { member: member({ id: 4 }), role: "Lecturer" },
        { member: null, role: "Tutor" },
      ],
    })
    expect(isTeachingStaff(offering, 3)).toBe(true)
    expect(isTeachingStaff(offering, 4)).toBe(true)
    expect(isTeachingStaff(offering, 5)).toBe(false)
  })
})

describe("toTeachingTeamRows", () => {
  const ada = { id: 3, firstName: "Ada", lastName: "Lovelace" }

  it("pairs each row with its member and leaves out deleted members", () => {
    const offering = version({
      teachingTeam: [
        { member: 3, role: "Tutor" },
        { member: 9, role: "Gone" },
        { member: null, role: "Also gone" },
      ],
    })
    expect(toTeachingTeamRows(offering, [ada])).toEqual([{ member: ada, role: "Tutor" }])
  })
})
