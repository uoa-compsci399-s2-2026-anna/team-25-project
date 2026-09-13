import type { Course, CourseVersion, Member } from "@repo/shared/payload-types"
import { describe, expect, it } from "vitest"
import type { CourseTableRow } from "./components/CoursesTable"
import {
  deriveLecturer,
  deriveStatus,
  deriveTitle,
  deriveUniversity,
  splitPeriod,
  summarizeCourses,
  summarizeMyCourses,
  toCourseTableRow,
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
    period: "2026 Semester 2",
    startDate: "2026-07-20",
    endDate: "2026-11-06",
    name: "Capstone: Computer Science",
    teachingTeam: [{ member: member(), role: "Course coordinator" }],
    _status: "published",
    ...overrides,
  }) as CourseVersion

describe("splitPeriod", () => {
  it("splits the year from the rest of the period", () => {
    expect(splitPeriod("2026 Semester 2")).toEqual({ year: 2026, semester: "Semester 2" })
  })

  it("keeps multi-word terms together", () => {
    expect(splitPeriod("2027 Full Year")).toEqual({ year: 2027, semester: "Full Year" })
  })

  it("falls back for a missing period", () => {
    expect(splitPeriod(undefined)).toEqual({ year: 0, semester: "—" })
    expect(splitPeriod(null)).toEqual({ year: 0, semester: "—" })
  })

  it("falls back when the leading token isn't a year", () => {
    expect(splitPeriod("TBD")).toEqual({ year: 0, semester: "—" })
  })
})

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
    expect(toCourseTableRow(course(), version())).toEqual({
      id: "10",
      code: "COMPSCI 399",
      title: "Capstone: Computer Science",
      lecturer: "A. Patel",
      university: "University of Auckland",
      semester: "Semester 2",
      year: 2026,
      status: "published",
    })
  })

  it("composes a placeholder row for a course with no offering yet", () => {
    expect(toCourseTableRow(course(), undefined)).toEqual({
      id: "10",
      code: "COMPSCI 399",
      title: "No offering yet",
      lecturer: "O. Fallback",
      university: "University of Auckland",
      semester: "—",
      year: 0,
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
  semester: "Semester 2",
  year: 2026,
  status: "published",
  ...overrides,
})

describe("summarizeCourses", () => {
  it("counts the directory and how many offerings run the full year", () => {
    const rows = [
      row({ semester: "Semester 2" }),
      row({ semester: "Full Year" }),
      row({ semester: "Trimester 1" }),
    ]
    const summary = summarizeCourses(rows)
    expect(summary.totalCourses).toBe(3)
    expect(summary.yearLongCourses).toBe(1)
  })

  it("returns zero counts for an empty directory", () => {
    expect(summarizeCourses([])).toEqual({
      totalCourses: 0,
      yearLongCourses: 0,
      industryRequiredCourses: 0,
      medianTeamSize: 4,
    })
  })
})

describe("summarizeMyCourses", () => {
  it("counts every id in the owned-course set, published or not", () => {
    const myCourseIds = new Set(["1", "2", "3"])
    const rows = [row({ id: "1", year: 2026, status: "published" })]

    expect(summarizeMyCourses(myCourseIds, rows, 2026).total).toBe(3)
  })

  it("counts a course as up to date only when its row is published for the given year", () => {
    const myCourseIds = new Set(["1", "2", "3"])
    const rows = [
      row({ id: "1", year: 2026, status: "published" }),
      row({ id: "2", year: 2025, status: "published" }),
      // id "3" has no row at all - an unpublished course, so it can't be up to date.
    ]

    expect(summarizeMyCourses(myCourseIds, rows, 2026)).toEqual({
      total: 3,
      upToDate: 1,
      year: 2026,
    })
  })

  it("ignores rows that aren't in the owned-course set", () => {
    const myCourseIds = new Set(["2"])
    const rows = [
      row({ id: "1", year: 2026, status: "published" }),
      row({ id: "2", year: 2026, status: "published" }),
    ]

    expect(summarizeMyCourses(myCourseIds, rows, 2026)).toEqual({
      total: 1,
      upToDate: 1,
      year: 2026,
    })
  })

  it("defaults to the current calendar year", () => {
    const summary = summarizeMyCourses(new Set(["1"]), [row({ id: "1" })])
    expect(summary.year).toBe(new Date().getFullYear())
  })
})
