"use server"

import { ProposalStatus } from "@repo/shared/enums/proposals"
import { postProposalFormSchema } from "@repo/shared/schemas/proposals"
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

export const postProposal = async (input: unknown): Promise<ActionResult> => {
  const parsed = postProposalFormSchema.safeParse(input)
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromIssues(parsed.error.issues), ok: false }
  }

  const { collection, user } = await getCurrentUser()
  if (!user || collection !== Slugs.Collections.MEMBERS) {
    return { formError: "Sign in as a member to post a proposal.", ok: false }
  }

  const payload = await getPayloadClient()

  try {
    await payload.create({
      collection: Slugs.Collections.PROPOSALS,
      data: {
        ...parsed.data,
        author: [], // The defaultProposalAuthor hook fills this in from the signed-in member.
        status: ProposalStatus.ACTIVE,
      },
      user,
      overrideAccess: false,
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      return resultFromValidationError(error, "Could not post your proposal. Try again.")
    }
    payload.logger.error({ err: error }, "postProposal failed")
    return { formError: "Could not post your proposal. Try again.", ok: false }
  }

  return { ok: true }
}
