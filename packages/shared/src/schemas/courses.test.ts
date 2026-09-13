import { describe, expect, it } from "vitest"
import { CourseDeliveryFormat } from "../enums/courses"
import { addCourseFormSchema, createCourseSchema } from "./courses"

const draftInput = {
  code: "CS399",
  intent: "draft" as const,
  name: "Capstone Project",
}

const publishInput = {
  ...draftInput,
  assessments: "Weekly sprint reviews.",
  deliveryFormat: CourseDeliveryFormat.HYBRID,
  endDate: "2026-11-06",
  intent: "publish" as const,
  learningOutcomes: "Design and ship a production system.",
  period: "Semester 2, 2026",
  programme: "Bachelor of Computer Science",
  projectType: "Industry-sponsored",
  role: "Course Coordinator",
  startDate: "2026-07-13",
}

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
      assessments: "",
      endDate: "",
      learningOutcomes: "",
      period: "",
      programme: "",
      projectType: "",
      role: "",
      startDate: "",
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
    "period",
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

  it("rejects blank publication fields, not just missing ones", () => {
    const result = addCourseFormSchema.safeParse({ ...publishInput, name: "   " })
    expect(result.success).toBe(false)
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
