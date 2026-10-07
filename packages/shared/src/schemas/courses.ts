import { CourseDeliveryFormat } from "@repo/shared/enums/courses"
import { z } from "zod"
import { richTextHasText, richTextSchema } from "./shared"

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
// The dialog sends `null` for a rich-text field the user has not typed in.
const requiredRichText = (message: string) =>
  richTextSchema
    .nullable()
    .refine((value) => value !== null && richTextHasText(value.root), message)

/**
 * A date input will hand back a year of any length, so "1444" and "12345" both
 * arrive as parseable dates no offering could have. Bounded here, where the
 * message can name the field, rather than left to fail further down.
 */
export const EARLIEST_OFFERING_YEAR = 2000
export const LATEST_OFFERING_YEAR = 2100

const parsedYear = (value: string) => {
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? new Date(parsed).getUTCFullYear() : null
}

const offeringDate = z
  .string()
  .refine((value) => parsedYear(value) !== null, "Enter a valid date")
  .refine((value) => {
    const year = parsedYear(value)
    return year === null || (year >= EARLIEST_OFFERING_YEAR && year <= LATEST_OFFERING_YEAR)
  }, `Year must be between ${EARLIEST_OFFERING_YEAR} and ${LATEST_OFFERING_YEAR}`)

const draftOfferingFields = {
  additionalInfo: richTextSchema.nullable().optional(),
  assessments: richTextSchema.nullable().optional(),
  // The dialog's Select always sends "" until a real option is picked - plain
  // `.optional()` only lets `undefined` through, so a untouched draft would
  // fail here with "Invalid option" instead of just leaving it unset.
  deliveryFormat: z.union([z.enum(CourseDeliveryFormat), z.literal("")]).optional(),
  // Like deliveryFormat, an untouched date input sends "" - allowed on a draft,
  // but anything actually entered is still bounded.
  endDate: z.union([offeringDate, z.literal("")]).optional(),
  learningOutcomes: richTextSchema.nullable().optional(),
  name: z.string().trim().min(1, "Course name is required"),
  period: z.string().trim().optional(),
  programme: z.string().trim().optional(),
  projectType: z.string().trim().optional(),
  role: z.string().trim().optional(),
  startDate: z.union([offeringDate, z.literal("")]).optional(),
}

/**
 * Publish: mirrors `validatePublication` in the CourseVersions collection
 * hooks, which requires every one of these plus a teaching team with at
 * least one member and role. This dialog has no member picker, so it
 * publishes with the signed-in creator as the sole teaching-team member -
 * `role` is that member's role in the offering.
 */
const publishOfferingFields = {
  // Optional even to publish - not every offering has more to say.
  additionalInfo: richTextSchema.nullable().optional(),
  assessments: requiredRichText("Assessments are required to publish"),
  deliveryFormat: z.enum(CourseDeliveryFormat, { error: "Select a delivery format to publish" }),
  endDate: z.string().min(1, "End date is required").pipe(offeringDate),
  learningOutcomes: requiredRichText("Learning outcomes are required to publish"),
  name: z.string().trim().min(1, "Course name is required to publish"),
  period: z.string().trim().min(1, "Teaching period is required"),
  programme: z.string().trim().min(1, "Course program is required to publish"),
  projectType: z.string().trim().min(1, "Project type is required to publish"),
  role: z.string().trim().min(1, "Your role is required to publish"),
  startDate: z.string().min(1, "Start date is required").pipe(offeringDate),
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
    (value) => {
      const start = Date.parse(value.startDate ?? "")
      const end = Date.parse(value.endDate ?? "")
      // Only a question once both dates are real. NaN compares false against
      // everything, so without this an unparseable date was reported as being
      // out of order rather than unparseable.
      if (!Number.isFinite(start) || !Number.isFinite(end)) return true
      return start <= end
    },
    {
      error: "The end date cannot precede the start date.",
      path: ["endDate"],
    },
  )

export type AddCourseFormInput = z.infer<typeof addCourseFormSchema>
