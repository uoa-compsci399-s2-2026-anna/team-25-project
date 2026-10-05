"use server"

import { QueryKeys } from "@repo/shared/constants/query-keys"
import { addPublicationFormSchema } from "@repo/shared/schemas/publications"
import { updateTag } from "next/cache"
import { ValidationError } from "payload"
import type { ActionResult } from "@/features/auth/actions/types"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"

type ZodIssue = { message: string; path: PropertyKey[] }

const fieldErrorsFromIssues = (issues: readonly ZodIssue[]): Record<string, string> => {
  const fieldErrors: Record<string, string> = {}
  for (const issue of issues) {
    const field = issue.path.join(".")
    // Only the first message per field is shown, matching one message per input.
    if (field && !fieldErrors[field]) {
      fieldErrors[field] = issue.message
    }
  }
  return fieldErrors
}

// A path-less or empty errors list produces {} - fall back to a form-level
// message rather than silently returning nothing to show.
const resultFromValidationError = (
  error: ValidationError,
  fallbackFormError: string,
): ActionResult => {
  const fieldErrors: Record<string, string> = {}
  for (const { path, message } of error.data?.errors ?? []) {
    if (path && !fieldErrors[path]) {
      fieldErrors[path] = message
    }
  }
  return Object.keys(fieldErrors).length > 0
    ? { fieldErrors, ok: false }
    : { formError: fallbackFormError, ok: false }
}

// The form sends every field, so a blank optional one must reach `create()`
// as `undefined`, never `""`.
const blankToUndefined = (value: string) => {
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

const parseTags = (tags: string) => {
  const parsed = tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
  return parsed.length > 0 ? [...new Set(parsed)] : undefined
}

export const createPublication = async (input: unknown): Promise<ActionResult> => {
  const parsed = addPublicationFormSchema.safeParse(input)
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromIssues(parsed.error.issues), ok: false }
  }

  const { collection, user } = await getCurrentUser()
  if (!user) {
    return { formError: "Sign in to add a publication.", ok: false }
  }
  // Admins can reach the page but own nothing, as on resources, so they get their own message
  // rather than one implying they aren't signed in.
  if (collection !== Slugs.Collections.MEMBERS) {
    return {
      formError: "Only members can add a publication - admins manage publications, not add them.",
      ok: false,
    }
  }

  const payload = await getPayloadClient()
  const { authors, month, tags, type, title, year, ...optional } = parsed.data

  try {
    await payload.create({
      collection: Slugs.Collections.PUBLICATIONS,
      data: {
        abstract: blankToUndefined(optional.abstract),
        // The creator is linked to their profile at the position they chose - the
        // requireLinkedAuthor hook rejects a member who is not linked as an author.
        authors: authors.map((author) =>
          author.kind === "self"
            ? { member: user.id, name: `${user.firstName} ${user.lastName}` }
            : { name: author.name },
        ),
        citationKey: blankToUndefined(optional.citationKey),
        doi: blankToUndefined(optional.doi),
        issue: blankToUndefined(optional.issue),
        month: month ? Number(month) : undefined,
        pages: blankToUndefined(optional.pages),
        publisher: blankToUndefined(optional.publisher),
        tags: parseTags(tags),
        title,
        type,
        url: blankToUndefined(optional.url),
        venue: blankToUndefined(optional.venue),
        volume: blankToUndefined(optional.volume),
        year,
      },
      overrideAccess: false,
      user,
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      return resultFromValidationError(error, "Could not add this publication. Try again.")
    }
    payload.logger.error({ err: error }, "createPublication failed")
    return { formError: "Could not add this publication. Try again.", ok: false }
  }

  updateTag(QueryKeys.PUBLICATIONS.ROOT)

  return { ok: true }
}
