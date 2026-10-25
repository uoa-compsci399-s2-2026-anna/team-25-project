"use server"

import { QueryKeys } from "@repo/shared/constants/query-keys"
import { editPublicationFormSchema } from "@repo/shared/schemas/publications"
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
    if (field && !fieldErrors[field]) {
      fieldErrors[field] = issue.message
    }
  }
  return fieldErrors
}

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

const UPDATE_FAILED = "Could not save this publication. Try again."

// Trim each optional field and store a blank one as unset, not "". The
// collection's blankToNull hooks also guard the unique fields.
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

/**
 * Saves an edit to an existing publication. The id comes from the browser, so it
 * isn't trusted: with overrideAccess: false, Payload's isAdminOrLinkedAuthor rule
 * refuses anyone but the publication's linked authors and admins.
 */
export const updatePublication = async (id: number, input: unknown): Promise<ActionResult> => {
  if (!Number.isInteger(id)) {
    return { formError: UPDATE_FAILED, ok: false }
  }

  const parsed = editPublicationFormSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors = fieldErrorsFromIssues(parsed.error.issues)
    return Object.keys(fieldErrors).length > 0
      ? { fieldErrors, ok: false }
      : { formError: "Could not save this publication. Check the form and try again.", ok: false }
  }

  const { user } = await getCurrentUser()
  if (!user) {
    return { formError: "Sign in to edit this publication.", ok: false }
  }

  const payload = await getPayloadClient()
  const { authors, month, tags, type, title, year, ...optional } = parsed.data

  try {
    await payload.update({
      collection: Slugs.Collections.PUBLICATIONS,
      id,
      data: {
        abstract: blankToUndefined(optional.abstract),
        authors: authors.map((author) =>
          author.kind === "member"
            ? { member: author.memberId, name: author.name }
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
      return resultFromValidationError(error, UPDATE_FAILED)
    }
    // Forbidden and NotFound too - one message, so it doesn't reveal whether the publication exists.
    payload.logger.error({ err: error, userId: user.id }, "updatePublication failed")
    return { formError: UPDATE_FAILED, ok: false }
  }

  try {
    updateTag(QueryKeys.PUBLICATIONS.ROOT)
  } catch (error) {
    payload.logger.error({ err: error }, "updatePublication could not update the cache")
  }

  return { ok: true }
}
