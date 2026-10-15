"use server"

import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateProposalSchema } from "@repo/shared/schemas/proposals"
import { updateTag } from "next/cache"
import { ValidationError } from "payload"
import type { ActionResult } from "@/features/auth/actions/types"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import { fieldErrorsFromIssues, resultFromValidationError } from "./errors"

const SAVE_FAILED = "Could not save your changes. Try again."

/**
 * The editor shows only formError, and a field error can name a field that isn't on screen -
 * e.g. the saved end year once the start year moves past it - so the first one is repeated there.
 */
const withFormError = (result: ActionResult): ActionResult => {
  if (result.ok || result.formError) return result
  const [first] = Object.values(result.fieldErrors ?? {})
  return { ...result, formError: first ?? SAVE_FAILED }
}

/**
 * Saves an in-place edit of a proposal. The id comes from the browser, so it's never
 * trusted: Payload's isAdminOrAuthors rule (overrideAccess: false) refuses anyone who
 * isn't an admin or one of its authors, and the schema strips author/status/institutions.
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
    // Forbidden and NotFound land here too - the same message for both, so the response
    // doesn't reveal whether a proposal the user can't edit exists.
    payload.logger.error({ err: error }, "updateProposal failed")
    return { formError: SAVE_FAILED, ok: false }
  }

  // The afterChange hook only marks these stale ("max"), which would show the editor the old
  // text once more - updateTag expires them now so the saved version shows straight away.
  updateTag(QueryKeys.PROPOSALS.ID(id))
  updateTag(QueryKeys.PROPOSALS.ROOT)

  return { ok: true }
}
