import type { Course, CourseVersion, Member } from "@repo/shared/payload-types"
import { describe, expect, it } from "vitest"
import type { CourseTableRow } from "./components/CoursesTable"
import {
  deriveLecturer,
  deriveStatus,
  deriveTitle,
  deriveUniversity,
  matchOffering,
  summarizeCourses,
  summarizeMyCourses,
  termAndYear,
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
    term: "semester2",
    year: 2026,
    period: "Semester 2 2026",
    startDate: "2026-07-20",
    endDate: "2026-11-06",
    name: "Capstone: Computer Science",
    teachingTeam: [{ member: member(), role: "Course coordinator" }],
    _status: "published",
    ...overrides,
  }) as CourseVersion

describe("termAndYear", () => {
  it("labels the term and passes the year through", () => {
    expect(termAndYear(version())).toEqual({ year: 2026, semester: "Semester 2" })
    expect(termAndYear(version({ term: "fullYear", year: 2027 }))).toEqual({
      year: 2027,
      semester: "Full Year",
    })
  })

  it("falls back when there's no offering yet", () => {
    expect(termAndYear(undefined)).toEqual({ year: 0, semester: "—" })
  })

  // A draft may have one half of its period and not the other.
  it("falls back for each half a draft hasn't set", () => {
    expect(termAndYear(version({ term: null, year: 2026 }))).toEqual({ year: 2026, semester: "—" })
    expect(termAndYear(version({ term: "semester1", year: null }))).toEqual({
      year: 0,
      semester: "Semester 1",
    })
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

  it("lists every offering for the period filters, keeping the order it was given", () => {
    const newer = version()
    const older = version({
      id: 99,
      term: "semester1",
      year: 2025,
      name: "Capstone (2025)",
      teachingTeam: [{ member: member({ firstName: "Maya", lastName: "Chen" }), role: "Lecturer" }],
    })

    expect(toCourseTableRow(course(), newer, [newer, older])).toEqual({
      id: "10",
      code: "COMPSCI 399",
      title: "Capstone: Computer Science",
      lecturer: "A. Patel",
      university: "University of Auckland",
      semester: "Semester 2",
      year: 2026,
      status: "published",
      // The offering the row shows, so its link can stay the plain course URL.
      currentOfferingId: 100,
      offerings: [
        {
          offeringId: 100,
          title: "Capstone: Computer Science",
          lecturer: "A. Patel",
          semester: "Semester 2",
          year: 2026,
        },
        {
          offeringId: 99,
          title: "Capstone (2025)",
          lecturer: "M. Chen",
          semester: "Semester 1",
          year: 2025,
        },
      ],
    })
  })

  // Not even an empty list: a draft row's lack of `offerings` is how
  // matchOffering knows to match it as itself.
  it("leaves offerings off a row built without them", () => {
    expect(toCourseTableRow(course(), version())).not.toHaveProperty("offerings")
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

describe("matchOffering", () => {
  const s2_2026 = {
    offeringId: 12,
    title: "Capstone 2026",
    lecturer: "A. Tui",
    semester: "Semester 2",
    year: 2026,
  }
  const s1_2026 = {
    offeringId: 11,
    title: "Capstone early 2026",
    lecturer: "B. Lee",
    semester: "Semester 1",
    year: 2026,
  }
  const s1_2025 = {
    offeringId: 10,
    title: "Capstone 2025",
    lecturer: "M. Chen",
    semester: "Semester 1",
    year: 2025,
  }
  // Newest first, as getCoursesTableData hands them over.
  const published = row({ offerings: [s2_2026, s1_2026, s1_2025] })

  it("returns the row unchanged when no filter is set", () => {
    expect(matchOffering(published, { semester: null, year: null })).toBe(published)
  })

  it("narrows to the newest offering in the semester", () => {
    expect(matchOffering(published, { semester: "Semester 1", year: null })).toEqual({
      ...published,
      ...s1_2026,
    })
  })

  it("narrows to the newest offering in the year", () => {
    expect(matchOffering(published, { semester: null, year: 2025 })).toEqual({
      ...published,
      ...s1_2025,
    })
  })

  it("narrows to the offering that matches both", () => {
    expect(matchOffering(published, { semester: "Semester 1", year: 2025 })).toEqual({
      ...published,
      ...s1_2025,
    })
  })

  // Each filter matching some offering isn't enough - they have to match the same one.
  it("does not mix the semester of one offering with the year of another", () => {
    const course = row({ offerings: [s2_2026, s1_2025] })

    expect(matchOffering(course, { semester: "Semester 1", year: 2026 })).toBeNull()
  })

  it("returns null when no offering matches", () => {
    expect(matchOffering(published, { semester: "Full Year", year: null })).toBeNull()
    expect(matchOffering(published, { semester: null, year: 2030 })).toBeNull()
  })

  it("matches a draft row without offerings as itself", () => {
    const draft = row({ status: "draft", semester: "Semester 1", year: 2027 })

    expect(matchOffering(draft, { semester: "Semester 1", year: 2027 })).toEqual(draft)
    expect(matchOffering(draft, { semester: "Semester 2", year: null })).toBeNull()
  })
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
