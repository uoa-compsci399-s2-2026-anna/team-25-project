import { PublicationType } from "@repo/shared/enums/publications"
import { z } from "zod"
import type { Publication } from "../payload-types"

export const DOI_PATTERN = /^10\.\d{4,9}\/\S+$/

const doiError = "Enter a DOI that starts with 10."

export const createPublicationSchema = z.object({
  citationKey: z.string().optional(),
  type: z.enum(PublicationType),
  title: z.string().min(1, "Title is required"),
  authors: z
    .array(
      z.object({
        name: z.string().min(1, "Author name is required"),
        member: z.number().optional(),
      }),
    )
    .min(1, "At least one author is required"),
  year: z.number().int().min(1000).max(9999),
  month: z.number().int().min(1).max(12).optional(),
  doi: z.string().regex(DOI_PATTERN, doiError).optional(),
  url: z.url().optional(),
  venue: z.string().optional(),
  volume: z.string().optional(),
  issue: z.string().optional(),
  pages: z.string().optional(),
  publisher: z.string().optional(),
  abstract: z.string().optional(),
  tags: z.array(z.string()).optional(),
}) satisfies z.ZodType<Omit<Publication, "id" | "createdAt" | "updatedAt">>

export type CreatePublicationInput = z.infer<typeof createPublicationSchema>

// The form sends every optional field, so a blank one arrives as "".
const blankOr = <T extends z.ZodType>(schema: T) => z.union([z.literal(""), schema])

export const addPublicationFormSchema = z.object({
  type: z.enum(PublicationType),
  title: z.string().trim().min(1, "Title is required"),
  // The signed-in member is always the first author, so the form sends only the rest.
  coAuthors: z.array(z.object({ name: z.string().trim().min(1, "Author name is required") })),
  year: z.number({ error: "Year is required" }).int().min(1000).max(9999),
  month: blankOr(z.string().regex(/^([1-9]|1[0-2])$/, "Choose a month")),
  doi: blankOr(z.string().trim().regex(DOI_PATTERN, doiError)),
  url: blankOr(z.url("Enter a full URL, e.g. https://example.com")),
  venue: z.string(),
  volume: z.string(),
  issue: z.string(),
  pages: z.string(),
  publisher: z.string(),
  citationKey: z.string(),
  abstract: z.string(),
  // Comma-separated.
  tags: z.string(),
})

export type AddPublicationFormInput = z.infer<typeof addPublicationFormSchema>
