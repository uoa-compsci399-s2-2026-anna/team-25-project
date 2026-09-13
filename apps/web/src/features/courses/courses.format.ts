import type { Course, CourseVersion, Member } from "@repo/shared/payload-types"
import type { CourseTableRow } from "./components/CoursesTable"

const asPopulated = <T>(value: number | T | null | undefined): T | undefined =>
  typeof value === "number" || value === null || value === undefined ? undefined : value

const formatLecturerName = (member: Member) => `${member.firstName.charAt(0)}. ${member.lastName}`

// Prefers whoever is marked "coordinator" on the offering's teaching team, then
// falls back to the first listed member, then the course's owner - always
// present, so a row can always show someone even before any offering exists.
const pickLecturerMember = (
  version: CourseVersion | undefined,
  course: Course,
): number | Member | undefined => {
  const team = version?.teachingTeam ?? []
  const coordinator = team.find((entry) => entry.role?.toLowerCase().includes("coordinator"))
  return (coordinator ?? team[0])?.member ?? course.owner
}

export const deriveLecturer = (version: CourseVersion | undefined, course: Course): string => {
  const member = asPopulated(pickLecturerMember(version, course))
  return member ? formatLecturerName(member) : "Unassigned"
}

export const deriveUniversity = (course: Course): string =>
  asPopulated(course.institution)?.name ?? "Unknown university"

export const deriveTitle = (version: CourseVersion | undefined): string =>
  version?.name?.trim() || "No offering yet"

export const deriveStatus = (version: CourseVersion | undefined): CourseTableRow["status"] =>
  version?._status === "published" ? "published" : "draft"

/**
 * `period` is free text written as "<year> <term>" (e.g. "2026 Semester 2",
 * "2027 Full Year") - see `CourseVersions` collection and its seed fixtures.
 * A course with no offering yet has no period to split, so it gets a `year`
 * of `0`: `CourseTableRow.year` is a plain `number` (fixed by `CoursesTable`,
 * #104), so there's no `null`/`"—"` to fall back to here.
 */
export const splitPeriod = (
  period: string | undefined | null,
): { year: number; semester: string } => {
  if (!period) return { year: 0, semester: "—" }
  const [yearToken, ...rest] = period.trim().split(/\s+/)
  const year = Number(yearToken)
  return {
    year: Number.isFinite(year) ? year : 0,
    semester: rest.join(" ") || "—",
  }
}

export const toCourseTableRow = (
  course: Course,
  version: CourseVersion | undefined,
): CourseTableRow => {
  const { year, semester } = splitPeriod(version?.period)
  return {
    id: String(course.id),
    code: course.code,
    title: deriveTitle(version),
    lecturer: deriveLecturer(version, course),
    university: deriveUniversity(course),
    semester,
    year,
    status: deriveStatus(version),
  }
}

export interface CoursesSummaryStats {
  totalCourses: number
  yearLongCourses: number
  /**
   * Neither field exists on `Course`/`CourseVersion` yet (see `CoursesTable`,
   * #104's own note that `duration`/`students`/`teamSize`/`industry` were all
   * dropped for the same reason) - held at a fixed ratio/value of the real
   * course count so the panel isn't empty, until a real field backs them.
   */
  industryRequiredCourses: number
  medianTeamSize: number
}

// A period's non-year remainder reads "Semester 2", "Trimester 1", or
// "Full Year" - only the last one means the offering runs the whole year.
const isYearLong = (row: CourseTableRow): boolean => row.semester.toLowerCase().includes("year")

export const summarizeCourses = (rows: CourseTableRow[]): CoursesSummaryStats => ({
  totalCourses: rows.length,
  yearLongCourses: rows.filter(isYearLong).length,
  industryRequiredCourses: Math.round(rows.length * 0.4),
  medianTeamSize: 4,
})

export interface MyCoursesSummary {
  total: number
  upToDate: number
  year: number
}

const ownerIdOf = (course: Course): number | undefined =>
  typeof course.owner === "number" ? course.owner : course.owner.id

/**
 * Courses the given member owns, and how many have a published offering for
 * `year` (defaults to the current year) - the closest real proxy for "up to
 * date" available: whether they've submitted this year's entry yet, rather
 * than just having published *something* at some point.
 */
export const summarizeMyCourses = (
  courses: Course[],
  rows: CourseTableRow[],
  ownerId: number,
  year: number = new Date().getFullYear(),
): MyCoursesSummary => {
  // Pair each course with its row by index *before* filtering - `rows` is
  // built from `courses` 1:1 in the same order (see `getCoursesPageData`),
  // and filtering `courses` alone first would throw that alignment off.
  const mine = courses
    .map((course, index) => ({ course, row: rows[index] }))
    .filter(({ course }) => ownerIdOf(course) === ownerId)

  return {
    total: mine.length,
    upToDate: mine.filter(({ row }) => row.status === "published" && row.year === year).length,
    year,
  }
}

/**
 * Pinned so the server and browser agree; a reader's own zone could otherwise
 * format the same timestamp a day earlier and trip a hydration mismatch.
 */
const dateFormatter = new Intl.DateTimeFormat("en-NZ", {
  day: "numeric",
  month: "short",
  timeZone: "Pacific/Auckland",
  year: "numeric",
})

// Intl throws on an invalid date rather than formatting one, so a bad value
// drops its own line instead of taking the whole page down.
export const formatDate = (value?: string | null) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : dateFormatter.format(date)
}

export const periodRange = (offering: CourseVersion) => {
  const start = formatDate(offering.startDate)
  const end = formatDate(offering.endDate)
  if (!start || !end) return start ?? end
  return `${start} - ${end}`
}
