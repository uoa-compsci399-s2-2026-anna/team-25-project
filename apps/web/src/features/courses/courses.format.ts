import type { Course, CourseVersion, Member } from "@repo/shared/payload-types"
import type { AddCapstoneCourseDialogValues } from "@repo/ui/components/composite"
import type { CourseTableRow } from "./components/CoursesTable"

const asPopulated = <T>(value: number | T | null | undefined): T | undefined =>
  typeof value === "number" || value === null || value === undefined ? undefined : value

const formatLecturerName = (member: Member) => `${member.firstName.charAt(0)}. ${member.lastName}`

// Picks the coordinator if there is one, otherwise the first teaching-team
// member, and falls back to the course owner if the team is empty.
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

// `period` is formatted as "<year> <term>", like "2026 Semester 2" or
// "2027 Full Year". If there's no offering yet there's no period to read, so
// `year` falls back to `0` - `CourseTableRow.year` has to be a plain number
// since that's how `CoursesTable` (#104) defined it.
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

/** A never-published course the viewer can reopen in the add-course dialog. */
export interface EditableDraftCourse {
  courseId: number
  versionId: number
  values: AddCapstoneCourseDialogValues
}

/** The viewer's own never-published courses, for the courses table. */
export interface MyDraftCourses {
  rows: CourseTableRow[]
  /** Keyed by the row's `id`, for reopening a draft in the add-course dialog. */
  editable: Record<string, EditableDraftCourse>
}

// Payload hands dates back as full ISO timestamps; a date input only takes the day.
const toDateInput = (value: string | null | undefined) => (value ? value.slice(0, 10) : "")

type DialogRichText = AddCapstoneCourseDialogValues["learningOutcomes"]

/**
 * Pre-fills the dialog from a draft. Drafts never store "Your role" - it only
 * becomes a teaching-team row on publish - so `role` is the member's profile
 * position, the same default a new course starts from.
 */
export const toEditableDraftCourse = (
  course: Course,
  version: CourseVersion,
  role: string,
): EditableDraftCourse => ({
  courseId: course.id,
  versionId: version.id,
  values: {
    additionalInfo: (version.additionalInfo ?? null) as DialogRichText,
    assessments: (version.assessments ?? null) as DialogRichText,
    code: course.code,
    deliveryFormat: version.deliveryFormat ?? "",
    endDate: toDateInput(version.endDate),
    learningOutcomes: (version.learningOutcomes ?? null) as DialogRichText,
    name: version.name ?? "",
    period: version.period ?? "",
    programme: version.programme ?? "",
    projectType: version.projectType ?? "",
    role,
    startDate: toDateInput(version.startDate),
  },
})

export interface CoursesSummaryStats {
  totalCourses: number
  yearLongCourses: number
  /**
   * Placeholder values for now - there's no field on `Course` or
   * `CourseVersion` for either yet (the same gap #104 already called out
   * when it dropped the industry/team-size columns).
   */
  industryRequiredCourses: number
  medianTeamSize: number
}

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

/**
 * `myCourseIds` holds every course the viewer owns, published or not.
 * `rows` is the public, published-only list. An unpublished course can never
 * count as "up to date" anyway, so it's fine that it won't have a row here.
 */
export const summarizeMyCourses = (
  myCourseIds: ReadonlySet<string>,
  rows: CourseTableRow[],
  year: number = new Date().getFullYear(),
): MyCoursesSummary => ({
  total: myCourseIds.size,
  upToDate: rows.filter(
    (row) => myCourseIds.has(row.id) && row.status === "published" && row.year === year,
  ).length,
  year,
})

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
