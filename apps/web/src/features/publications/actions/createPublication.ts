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

const CREATE_FAILED = "Could not add this publication. Try again."

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

export const createPublication = async (input: unknown): Promise<ActionResult> => {
  const parsed = addPublicationFormSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors = fieldErrorsFromIssues(parsed.error.issues)
    // An issue with no path (a non-object input) has no field to show on.
    return Object.keys(fieldErrors).length > 0
      ? { fieldErrors, ok: false }
      : { formError: "Could not add this publication. Check the form and try again.", ok: false }
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

  // The member's own row must be the self row, so they are not linked twice.
  const selfAsMember = parsed.data.authors.findIndex(
    (author) => author.kind === "member" && author.memberId === user.id,
  )
  if (selfAsMember !== -1) {
    return {
      fieldErrors: { [`authors.${selfAsMember}.member`]: "You are already in the author list." },
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
        authors: authors.map((author) => {
          if (author.kind === "self") {
            return { member: user.id, name: `${user.firstName} ${user.lastName}` }
          }
          return author.kind === "member"
            ? { member: author.memberId, name: author.name }
            : { name: author.name }
        }),
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
      return resultFromValidationError(error, CREATE_FAILED)
    }
    payload.logger.error({ err: error, userId: user.id }, "createPublication failed")
    return { formError: CREATE_FAILED, ok: false }
  }

  // The publication is saved. A cache failure must not make the user add it again.
  try {
    updateTag(QueryKeys.PUBLICATIONS.ROOT)
  } catch (error) {
    payload.logger.error({ err: error }, "createPublication could not update the cache")
  }

  return { ok: true }
}
