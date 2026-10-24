import type { Course, CourseVersion, Member } from "@repo/shared/payload-types"
import type { AddCapstoneCourseDialogValues } from "@repo/ui/components/composite"
import type { CourseTableRow } from "./components/CoursesTable"

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

export const deriveTitle = (version: CourseVersion | undefined): string =>
  version?.name?.trim() || "No offering yet"

export const deriveStatus = (version: CourseVersion | undefined): CourseTableRow["status"] =>
  version?._status === "published" ? "published" : "draft"

// Dates are saved as midnight UTC on the day entered, so the first ten characters are that day.
const dayOf = (value: string | null | undefined) => value?.slice(0, 10) ?? ""

/**
 * The whole app reads dates in one zone, whichever institution or reader they belong
 * to. Elsewhere in Australia and New Zealand that's at most a few hours out, and only
 * on an offering's first and last day.
 */
const APP_TIME_ZONE = "Pacific/Auckland"

/** Today in the app's zone as "YYYY-MM-DD", to compare against an offering's days. */
export const getToday = (now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIME_ZONE }).format(now)

type DatedOffering = Pick<CourseVersion, "id" | "startDate" | "endDate">

/**
 * Finds the offering running today and the one starting next, from offerings sorted
 * newest first - so where two overlap, the one that started most recently is current.
 * `primary` is the one a course is shown as: the current one, or between offerings the
 * next, or once none are left the most recent.
 */
export const findCurrentOffering = <T extends DatedOffering>(offerings: T[], today: string) => {
  const started = offerings.filter((offering) => dayOf(offering.startDate) <= today)
  const current = started.find((offering) => today <= dayOf(offering.endDate))
  const upcoming = offerings.filter((offering) => dayOf(offering.startDate) > today)
  const next = upcoming[upcoming.length - 1]
  return { current, next, primary: current ?? next ?? started[0] ?? offerings[0] }
}

/** The offering `?offering=` asks for, or the course's primary one when it names none we have. */
export const selectOffering = <T extends DatedOffering>(
  offerings: T[],
  offeringId: number | undefined,
  today: string,
) => {
  const found = findCurrentOffering(offerings, today)
  const offering = offerings.find((candidate) => candidate.id === offeringId) ?? found.primary
  return { ...found, offering }
}

export type OfferingTiming = "past" | "current" | "running" | "next" | "future"

/** `running` is an offering still underway that isn't current, as a newer one overlaps it. */
export const offeringTiming = (
  offering: Pick<CourseVersion, "id" | "startDate" | "endDate">,
  { current, next }: { current?: Pick<CourseVersion, "id">; next?: Pick<CourseVersion, "id"> },
  today: string,
): OfferingTiming => {
  if (offering.id === current?.id) return "current"
  if (offering.id === next?.id) return "next"
  if (dayOf(offering.startDate) > today) return "future"
  return dayOf(offering.endDate) < today ? "past" : "running"
}

export const toCourseTableRow = (
  course: Course,
  version: CourseVersion | undefined,
  offerings: number,
): CourseTableRow => ({
  id: String(course.id),
  code: course.code,
  title: deriveTitle(version),
  lecturer: deriveLecturer(version, course),
  university: deriveUniversity(course),
  currentOffering: version?.period?.trim() || "—",
  currentStartDate: version?.startDate ?? "",
  offerings,
  status: deriveStatus(version),
})

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
    period: version.period ?? "",
    programme: version.programme ?? "",
    projectType: version.projectType ?? "",
    role: viewer.role,
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

const isYearLong = (row: CourseTableRow): boolean =>
  row.currentOffering.toLowerCase().includes("year")

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
    (row) =>
      myCourseIds.has(row.id) &&
      row.status === "published" &&
      row.currentStartDate.startsWith(String(year)),
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
  timeZone: APP_TIME_ZONE,
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
