import { CourseTermLabels, derivePeriod } from "@repo/shared/enums/courses"
import type { Course, CourseVersion, Member } from "@repo/shared/payload-types"
import type { AddCapstoneCourseDialogValues } from "@repo/ui/components/composite"
import type { CourseTableOffering, CourseTableRow } from "./components/CoursesTable"

const asPopulated = <T>(value: number | T | null | undefined): T | undefined =>
  typeof value === "number" || value === null || value === undefined ? undefined : value

export const ownerIdOf = (course: Pick<Course, "owner">): number | undefined =>
  typeof course.owner === "number" ? course.owner : course.owner?.id

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

/**
 * An offering's period label. Stored on every write, so the fallbacks only
 * cover a row saved before it was derived, or a draft without its period yet.
 */
export const offeringPeriod = (offering: Pick<CourseVersion, "period" | "term" | "year">) =>
  offering.period || derivePeriod(offering) || "Unscheduled"

export const deriveTitle = (version: CourseVersion | undefined): string =>
  version?.name?.trim() || "No offering yet"

export const deriveStatus = (version: CourseVersion | undefined): CourseTableRow["status"] =>
  version?._status === "published" ? "published" : "draft"

// A draft may not have its term or year yet, so each falls back to a
// placeholder - `CourseTableRow.year` has to be a plain number since that's
// how `CoursesTable` (#104) defined it.
export const termAndYear = (
  version: Pick<CourseVersion, "term" | "year"> | undefined,
): { year: number; semester: string } => ({
  year: version?.year ?? 0,
  semester: version?.term ? CourseTermLabels[version.term] : "—",
})

const toCourseTableOffering = (version: CourseVersion, course: Course): CourseTableOffering => ({
  offeringId: version.id,
  title: deriveTitle(version),
  lecturer: deriveLecturer(version, course),
  ...termAndYear(version),
})

/**
 * `version` is the offering the row shows; `offerings` is every published one,
 * newest first, for the semester/year filters to match against.
 */
export const toCourseTableRow = (
  course: Course,
  version: CourseVersion | undefined,
  offerings?: CourseVersion[],
): CourseTableRow => ({
  id: String(course.id),
  code: course.code,
  title: deriveTitle(version),
  lecturer: deriveLecturer(version, course),
  university: deriveUniversity(course),
  ...termAndYear(version),
  status: deriveStatus(version),
  ...(offerings && {
    currentOfferingId: version?.id,
    offerings: offerings.map((offering) => toCourseTableOffering(offering, course)),
  }),
})

export interface CoursePeriodFilter {
  semester: string | null
  year: number | null
}

/**
 * The row as the newest of its offerings that matches every set filter, or
 * `null` when none does. Both filters have to match the same offering, so a
 * course taught in Semester 1 2025 and Semester 2 2026 is no match for
 * Semester 1 2026. A matched row links to that offering rather than the
 * course's current one. A draft row has no `offerings`, so it matches as itself.
 */
export const matchOffering = (
  row: CourseTableRow,
  { semester, year }: CoursePeriodFilter,
): CourseTableRow | null => {
  if (semester === null && year === null) return row

  const candidates = row.offerings ?? [row]
  const match = candidates.find(
    (offering) =>
      (semester === null || offering.semester === semester) &&
      (year === null || offering.year === year),
  )
  if (!match) return null

  const { offeringId, title, lecturer } = match
  return { ...row, title, lecturer, semester: match.semester, year: match.year, offeringId }
}

/** A never-published course the viewer can reopen in the add-course dialog. */
export interface EditableDraftCourse {
  courseId: number
  versionId: number
  /** Only the owner may delete a draft; its editors can still edit it. */
  canDelete: boolean
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
 * becomes a teaching-team row on publish - so the viewer's `role` is their profile
 * position, the same default a new course starts from.
 */
export const toEditableDraftCourse = (
  course: Course,
  version: CourseVersion,
  viewer: { id: number; role: string },
): EditableDraftCourse => ({
  canDelete: ownerIdOf(course) === viewer.id,
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
    programme: version.programme ?? "",
    projectType: version.projectType ?? "",
    role: viewer.role,
    startDate: toDateInput(version.startDate),
    term: version.term ?? "",
    year: version.year ? String(version.year) : "",
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
