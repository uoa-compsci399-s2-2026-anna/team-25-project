import { describe, expect, it } from "vitest"
import { CourseDeliveryFormat, CourseTerm } from "../enums/courses"
import { addCourseFormSchema, createCourseSchema, offeringFormSchema } from "./courses"

const richText = (text: string) => ({
  root: {
    type: "root",
    children: [
      { type: "paragraph", version: 1, children: text ? [{ type: "text", version: 1, text }] : [] },
    ],
    direction: null,
    format: "" as const,
    indent: 0,
    version: 1,
  },
})

const draftInput = {
  code: "CS399",
  intent: "draft" as const,
  name: "Capstone Project",
}

const publishInput = {
  ...draftInput,
  assessments: richText("Weekly sprint reviews."),
  deliveryFormat: CourseDeliveryFormat.HYBRID,
  endDate: "2026-11-06",
  intent: "publish" as const,
  learningOutcomes: richText("Design and ship a production system."),
  programme: "Bachelor of Computer Science",
  projectType: "Industry-sponsored",
  role: "Course Coordinator",
  startDate: "2026-07-13",
  term: CourseTerm.SEMESTER_2,
  year: "2026",
}

const issueFor = (
  result: { success: boolean; error?: { issues: Array<{ path: PropertyKey[]; message: string }> } },
  field: string,
) => result.error?.issues.find((issue) => issue.path[0] === field)?.message

describe("createCourseSchema", () => {
  it("accepts a valid course code", () => {
    expect(createCourseSchema.safeParse({ code: "CS399" }).success).toBe(true)
  })

  it("rejects an empty code", () => {
    expect(createCourseSchema.safeParse({ code: "  " }).success).toBe(false)
  })
})

describe("addCourseFormSchema (draft)", () => {
  it("accepts just a code and a name - nothing else is settled yet", () => {
    expect(addCourseFormSchema.safeParse(draftInput).success).toBe(true)
  })

  it.each(["code", "name"] as const)("requires %s", (field) => {
    const { [field]: _omitted, ...rest } = draftInput
    expect(addCourseFormSchema.safeParse(rest).success).toBe(false)
  })

  it("accepts the teaching period and every publication-only field as optional", () => {
    const result = addCourseFormSchema.safeParse({
      ...draftInput,
      assessments: null,
      // The dialog's Select sends "" until an option is picked - a plain
      // z.enum(...).optional() only lets undefined through, not "", so this
      // one guards against that regressing.
      deliveryFormat: "",
      endDate: "",
      learningOutcomes: null,
      programme: "",
      projectType: "",
      role: "",
      startDate: "",
      term: "",
      year: "",
    })
    expect(result.success).toBe(true)
  })

  it("rejects an end date before the start date when both are given", () => {
    const result = addCourseFormSchema.safeParse({
      ...draftInput,
      endDate: "2026-01-01",
      startDate: "2026-02-01",
    })
    expect(result.success).toBe(false)
  })

  it("does not reject a start date given without an end date, or vice versa", () => {
    expect(addCourseFormSchema.safeParse({ ...draftInput, startDate: "2026-02-01" }).success).toBe(
      true,
    )
    expect(addCourseFormSchema.safeParse({ ...draftInput, endDate: "2026-02-01" }).success).toBe(
      true,
    )
  })
})

describe("addCourseFormSchema (publish)", () => {
  it("accepts a fully filled-in offering", () => {
    expect(addCourseFormSchema.safeParse(publishInput).success).toBe(true)
  })

  it.each([
    "name",
    "term",
    "year",
    "startDate",
    "endDate",
    "programme",
    "deliveryFormat",
    "projectType",
    "learningOutcomes",
    "assessments",
    "role",
  ] as const)("requires %s to publish", (field) => {
    const { [field]: _omitted, ...rest } = publishInput
    expect(addCourseFormSchema.safeParse(rest).success).toBe(false)
  })

  it("publishes without additional information", () => {
    expect(addCourseFormSchema.safeParse({ ...publishInput, additionalInfo: null }).success).toBe(
      true,
    )
  })

  it("rejects blank publication fields, not just missing ones", () => {
    const result = addCourseFormSchema.safeParse({ ...publishInput, name: "   " })
    expect(result.success).toBe(false)
  })

  it.each(["learningOutcomes", "assessments"] as const)(
    "rejects %s with no text in it, as the editor holds once cleared",
    (field) => {
      expect(addCourseFormSchema.safeParse({ ...publishInput, [field]: null }).success).toBe(false)
      expect(
        addCourseFormSchema.safeParse({ ...publishInput, [field]: richText("  ") }).success,
      ).toBe(false)
    },
  )

  // A date input takes a year of any length, so both of these parse as real
  // dates and used to sail through to the server.
  it.each([
    ["a year before any offering", "1444-01-01", "1444-06-01"],
    ["a year past any offering", "12345-01-01", "12345-06-01"],
  ])("rejects %s", (_label, startDate, endDate) => {
    const result = addCourseFormSchema.safeParse({ ...publishInput, endDate, startDate })

    expect(result.success).toBe(false)
    expect(issueFor(result, "startDate")).toBe("Year must be between 2000 and 2100")
    expect(issueFor(result, "endDate")).toBe("Year must be between 2000 and 2100")
  })

  // NaN compares false against everything, so an unparseable date used to be
  // reported as being out of order rather than unparseable.
  it("says an unparseable date is invalid rather than out of order", () => {
    const result = addCourseFormSchema.safeParse({
      ...publishInput,
      endDate: "also-not-a-date",
      startDate: "not-a-date",
    })

    expect(issueFor(result, "startDate")).toBe("Enter a valid date")
    expect(issueFor(result, "endDate")).toBe("Enter a valid date")
  })

  it.each([
    ["two digits", "26", "Enter a four-digit year"],
    ["words", "next year", "Enter a four-digit year"],
    ["a year before any offering", "1999", "Year must be between 2000 and 2100"],
    ["a year past any offering", "2101", "Year must be between 2000 and 2100"],
  ])("rejects a year given as %s", (_label, year, message) => {
    expect(issueFor(addCourseFormSchema.safeParse({ ...publishInput, year }), "year")).toBe(message)
  })

  it("rejects a term that isn't one of the offered ones", () => {
    const result = addCourseFormSchema.safeParse({ ...publishInput, term: "semester3" })
    expect(issueFor(result, "term")).toBe("Select a term to publish")
  })

  it("still bounds a year a draft is saved with", () => {
    const result = addCourseFormSchema.safeParse({ ...draftInput, year: "1999" })
    expect(issueFor(result, "year")).toBe("Year must be between 2000 and 2100")
  })

  it("rejects an end date before the start date", () => {
    const result = addCourseFormSchema.safeParse({
      ...publishInput,
      endDate: "2026-01-01",
      startDate: "2026-02-01",
    })
    expect(result.success).toBe(false)
  })
})

describe("offeringFormSchema", () => {
  const { code: _code, role: _role, ...publishOffering } = publishInput

  it("takes an offering without a course code, which belongs to the course", () => {
    expect(
      offeringFormSchema.safeParse({ intent: "draft", name: "Capstone Project" }).success,
    ).toBe(true)
    expect(offeringFormSchema.safeParse(publishOffering).success).toBe(true)
  })

  // Only needed when the offering has no teaching team yet, which the action knows.
  it("leaves the role optional even to publish", () => {
    expect(offeringFormSchema.safeParse({ ...publishOffering, role: "" }).success).toBe(true)
  })

  // Only needed to correct a published offering, which the action knows.
  it("leaves the change summary optional, trimmed when given", () => {
    const result = offeringFormSchema.safeParse({
      ...publishOffering,
      changeSummary: "  Moved week 12  ",
    })
    expect(result.success && result.data.changeSummary).toBe("Moved week 12")
  })

  it("still requires the publication fields to publish", () => {
    const result = offeringFormSchema.safeParse({ ...publishOffering, term: "" })
    expect(issueFor(result, "term")).toBe("Select a term to publish")
  })

  it("refuses an end date before the start date", () => {
    const result = offeringFormSchema.safeParse({
      ...publishOffering,
      endDate: "2026-07-01",
      startDate: "2026-07-13",
    })
    expect(issueFor(result, "endDate")).toBe("The end date cannot precede the start date.")
  })
})
