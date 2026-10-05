import { PublicationType } from "@repo/shared/enums/publications"
import { z } from "zod"

export const DOI_PATTERN = /^10\.\d{4,9}\/\S+$/

export const DOI_ERROR = "Enter a DOI that starts with 10."

export const URL_ERROR = "Enter a full URL that starts with https:// or http://"

export const DOI_OR_URL_ERROR = "Enter a DOI or a URL"

// z.url() accepts any protocol, including javascript: and data:. Only allow web
// links, because the URL is shown as a link.
export const webUrlSchema = z.url({
  protocol: /^https?$/,
  hostname: z.regexes.domain,
  error: URL_ERROR,
})

// The form sends every optional field, so a blank one arrives as "". Only fields
// with a format check need this, because the check would reject "".
const blankOr = <T extends z.ZodType>(schema: T) => z.union([z.literal(""), schema])

// Allow next year for accepted papers that are not yet published. Read the year
// at parse time, so a long-running server does not keep a stale limit.
export const latestPublicationYear = () => new Date().getFullYear() + 1

export const authorNameSchema = z.string().trim().min(1, "Author name is required")

// `id` is a stable key for drag-and-drop - the server ignores it. `name` is the name
// as printed on the publication, e.g. "J. Smith". The signed-in member's row has no
// member id - the server takes it from the session. A blank name there means the
// profile name.
const formAuthorSchema = z.discriminatedUnion("kind", [
  z.object({ id: z.string(), kind: z.literal("self"), name: z.string().trim() }),
  z.object({
    id: z.string(),
    kind: z.literal("member"),
    memberId: z.number().int().positive(),
    name: authorNameSchema,
  }),
  z.object({ id: z.string(), kind: z.literal("external"), name: authorNameSchema }),
])

export const addPublicationFormSchema = z
  .object({
    type: z.enum(PublicationType),
    title: z.string().trim().min(1, "Title is required"),
    // Ordered as cited. The signed-in member appears exactly once, in any position.
    authors: z
      .array(formAuthorSchema)
      .refine(
        (authors) => authors.filter((author) => author.kind === "self").length === 1,
        "Include yourself as one of the authors.",
      )
      .refine((authors) => {
        const ids = authors.flatMap((author) => (author.kind === "member" ? [author.memberId] : []))
        return new Set(ids).size === ids.length
      }, "Each member can be an author only once."),
    // An empty year input gives NaN, which fails the number check.
    year: z
      .number({ error: "Year is required" })
      .int("Enter a whole year")
      .min(1000, "Enter a 4-digit year")
      .refine((year) => year <= latestPublicationYear(), {
        error: () => `Enter a year no later than ${latestPublicationYear()}`,
      }),
    month: blankOr(z.string().regex(/^([1-9]|1[0-2])$/, "Choose a month")),
    doi: blankOr(z.string().trim().regex(DOI_PATTERN, DOI_ERROR)),
    url: blankOr(webUrlSchema),
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
  .superRefine(({ doi, url }, ctx) => {
    if (doi || url) return
    for (const path of ["doi", "url"]) {
      ctx.addIssue({ code: "custom", path: [path], message: DOI_OR_URL_ERROR })
    }
  })

export type AddPublicationFormInput = z.infer<typeof addPublicationFormSchema>
