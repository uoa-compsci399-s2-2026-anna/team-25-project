export const CourseDeliveryFormat = {
  IN_PERSON: "inPerson",
  ONLINE: "online",
  HYBRID: "hybrid",
} as const

export type CourseDeliveryFormat = (typeof CourseDeliveryFormat)[keyof typeof CourseDeliveryFormat]

export const CourseDeliveryFormatLabels: Record<CourseDeliveryFormat, string> = {
  [CourseDeliveryFormat.IN_PERSON]: "In person",
  [CourseDeliveryFormat.ONLINE]: "Online",
  [CourseDeliveryFormat.HYBRID]: "Hybrid",
} as const

/** Listed in calendar order, which is also the order the term picker offers them in. */
export const CourseTerm = {
  SUMMER_SCHOOL: "summerSchool",
  SEMESTER_1: "semester1",
  SEMESTER_2: "semester2",
  FULL_YEAR: "fullYear",
} as const

export type CourseTerm = (typeof CourseTerm)[keyof typeof CourseTerm]

export const CourseTermLabels: Record<CourseTerm, string> = {
  [CourseTerm.SUMMER_SCHOOL]: "Summer School",
  [CourseTerm.SEMESTER_1]: "Semester 1",
  [CourseTerm.SEMESTER_2]: "Semester 2",
  [CourseTerm.FULL_YEAR]: "Full Year",
} as const

/**
 * The display label an offering's `period` is derived from, e.g. "Semester 2 2026".
 * Matches the proposals timeframe's "<term> <year>" order.
 */
export const coursePeriodLabel = (term: CourseTerm, year: number) =>
  `${CourseTermLabels[term]} ${year}`

/** The label for an offering's term and year, or `null` until both are set. */
export const derivePeriod = ({
  term,
  year,
}: {
  term?: CourseTerm | null
  year?: number | null
}): string | null => (term && year ? coursePeriodLabel(term, year) : null)
