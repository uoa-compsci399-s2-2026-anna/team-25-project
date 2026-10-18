import { describe, expect, it } from "vitest"
import { CourseDeliveryFormat, CourseTerm, coursePeriodLabel, derivePeriod } from "./courses"

describe("CourseDeliveryFormat", () => {
  // The stored values reach the database through the field's option list, so a
  // rename here silently invalidates every saved offering.
  it("keeps the values Payload persists", () => {
    expect(CourseDeliveryFormat).toEqual({
      IN_PERSON: "inPerson",
      ONLINE: "online",
      HYBRID: "hybrid",
    })
  })
})

describe("CourseTerm", () => {
  // Persisted through the select's options and backfilled by a migration's SQL.
  it("keeps the values Payload persists", () => {
    expect(CourseTerm).toEqual({
      SUMMER_SCHOOL: "summerSchool",
      SEMESTER_1: "semester1",
      SEMESTER_2: "semester2",
      FULL_YEAR: "fullYear",
    })
  })
})

describe("coursePeriodLabel", () => {
  it.each([
    [CourseTerm.SUMMER_SCHOOL, 2027, "Summer School 2027"],
    [CourseTerm.SEMESTER_1, 2026, "Semester 1 2026"],
    [CourseTerm.SEMESTER_2, 2026, "Semester 2 2026"],
    [CourseTerm.FULL_YEAR, 2027, "Full Year 2027"],
  ])("labels %s %d as %s", (term, year, label) => {
    expect(coursePeriodLabel(term, year)).toBe(label)
  })
})

describe("derivePeriod", () => {
  it("labels a term and year", () => {
    expect(derivePeriod({ term: CourseTerm.SEMESTER_2, year: 2026 })).toBe("Semester 2 2026")
  })

  it.each([
    ["no term", { year: 2026 }],
    ["no year", { term: CourseTerm.SEMESTER_1 }],
    ["neither", {}],
    ["nulls", { term: null, year: null }],
  ])("is null with %s", (_label, version) => {
    expect(derivePeriod(version)).toBeNull()
  })
})
