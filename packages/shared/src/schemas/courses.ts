import { CourseDeliveryFormat } from "@repo/shared/enums/courses"
import { z } from "zod"

/**
 * Shared by the client form and the server action, so a course can never be
 * validated one way in the browser and another way on the server.
 */

export const createCourseSchema = z.object({
  code: z.string().trim().min(1, "Course code is required"),
})

export type CreateCourseInput = z.infer<typeof createCourseSchema>

/**
 * Draft: only the two things needed to find and recognise it later. Even the
 * teaching period is settled later, before publication (see the
 * CourseVersions collection hooks' `validatePeriod`, which now skips a draft
 * save for the same reason).
 */
const draftOfferingFields = {
  assessments: z.string().trim().optional(),
  // The dialog's Select always sends "" until a real option is picked - plain
  // `.optional()` only lets `undefined` through, so a untouched draft would
  // fail here with "Invalid option" instead of just leaving it unset.
  deliveryFormat: z.union([z.enum(CourseDeliveryFormat), z.literal("")]).optional(),
  endDate: z.string().optional(),
  learningOutcomes: z.string().trim().optional(),
  name: z.string().trim().min(1, "Course name is required"),
  period: z.string().trim().optional(),
  programme: z.string().trim().optional(),
  projectType: z.string().trim().optional(),
  role: z.string().trim().optional(),
  startDate: z.string().optional(),
}

/**
 * Publish: mirrors `validatePublication` in the CourseVersions collection
 * hooks, which requires every one of these plus a teaching team with at
 * least one member and role. This dialog has no member picker, so it
 * publishes with the signed-in creator as the sole teaching-team member -
 * `role` is that member's role in the offering.
 */
const publishOfferingFields = {
  assessments: z.string().trim().min(1, "Assessments are required to publish"),
  deliveryFormat: z.enum(CourseDeliveryFormat, { error: "Select a delivery format to publish" }),
  endDate: z.string().min(1, "End date is required"),
  learningOutcomes: z.string().trim().min(1, "Learning outcomes are required to publish"),
  name: z.string().trim().min(1, "Course name is required to publish"),
  period: z.string().trim().min(1, "Teaching period is required"),
  programme: z.string().trim().min(1, "Course program is required to publish"),
  projectType: z.string().trim().min(1, "Project type is required to publish"),
  role: z.string().trim().min(1, "Your role is required to publish"),
  startDate: z.string().min(1, "Start date is required"),
}

export const addCourseFormSchema = z
  .discriminatedUnion("intent", [
    z.object({
      intent: z.literal("draft"),
      ...createCourseSchema.shape,
      ...draftOfferingFields,
    }),
    z.object({
      intent: z.literal("publish"),
      ...createCourseSchema.shape,
      ...publishOfferingFields,
    }),
  ])
  .refine(
    (value) =>
      !value.startDate ||
      !value.endDate ||
      Date.parse(value.startDate) <= Date.parse(value.endDate),
    {
      error: "The end date cannot precede the start date.",
      path: ["endDate"],
    },
  )

export type AddCourseFormInput = z.infer<typeof addCourseFormSchema>
