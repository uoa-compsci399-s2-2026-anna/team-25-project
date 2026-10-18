"use server"

import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateProposalSchema } from "@repo/shared/schemas/proposals"
import { updateTag } from "next/cache"
import { ValidationError } from "payload"
import type { ActionResult } from "@/features/auth/actions/types"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import { fieldErrorsFromIssues, resultFromValidationError } from "./validationErrors"

const SAVE_FAILED = "Could not save your changes. Try again."

// The editor only shows formError, so a field's message is repeated there.
const withFormError = (result: ActionResult): ActionResult =>
  result.ok || result.formError
    ? result
    : { ...result, formError: Object.values(result.fieldErrors ?? {})[0] ?? SAVE_FAILED }

/**
 * Saves an in-place edit. The id comes from the browser, so it isn't trusted: with
 * overrideAccess: false, Payload's isAdminOrAuthors rule refuses anyone else.
 */
export const updateProposal = async (id: number, input: unknown): Promise<ActionResult> => {
  const { user } = await getCurrentUser()
  if (!user) {
    return { formError: "Sign in to edit this proposal.", ok: false }
  }
  if (!Number.isInteger(id)) {
    return { formError: SAVE_FAILED, ok: false }
  }

  const parsed = updateProposalSchema.safeParse(input)
  if (!parsed.success) {
    return withFormError({ fieldErrors: fieldErrorsFromIssues(parsed.error.issues), ok: false })
  }

  const payload = await getPayloadClient()

  try {
    await payload.update({
      collection: Slugs.Collections.PROPOSALS,
      id,
      data: parsed.data,
      user,
      overrideAccess: false,
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      return withFormError(resultFromValidationError(error, SAVE_FAILED))
    }
    // Forbidden and NotFound too - one message, so it doesn't reveal whether the proposal exists.
    payload.logger.error({ err: error }, "updateProposal failed")
    return { formError: SAVE_FAILED, ok: false }
  }

  // The afterChange hook only marks these stale, so the editor would see the old text once more.
  updateTag(QueryKeys.PROPOSALS.ID(id))
  updateTag(QueryKeys.PROPOSALS.ROOT)

  return { ok: true }
}
