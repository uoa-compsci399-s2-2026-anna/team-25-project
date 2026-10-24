"use server"

import { QueryKeys } from "@repo/shared/constants/query-keys"
import { updateResourceSchema } from "@repo/shared/schemas/resources"
import { updateTag } from "next/cache"
import { ValidationError } from "payload"
import type { ActionResult } from "@/features/auth/actions/types"
import { fieldErrorsFromIssues, resultFromValidationError } from "@/lib/actions/validationErrors"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"

const SAVE_FAILED = "Could not save your changes. Try again."

// The editor only shows formError, so a field's message is repeated there.
const withFormError = (result: ActionResult): ActionResult =>
  result.ok || result.formError
    ? result
    : { ...result, formError: Object.values(result.fieldErrors ?? {})[0] ?? SAVE_FAILED }

/**
 * Saves an in-place edit. The id comes from the browser, so it isn't trusted: with
 * overrideAccess: false, Payload's isAdminOrOwner rule refuses anyone else.
 */
export const updateResource = async (id: number, input: unknown): Promise<ActionResult> => {
  const { user } = await getCurrentUser()
  if (!user) {
    return { formError: "Sign in to edit this resource.", ok: false }
  }
  if (!Number.isInteger(id)) {
    return { formError: SAVE_FAILED, ok: false }
  }

  const parsed = updateResourceSchema.safeParse(input)
  if (!parsed.success) {
    return withFormError({ fieldErrors: fieldErrorsFromIssues(parsed.error.issues), ok: false })
  }

  const payload = await getPayloadClient()

  try {
    await payload.update({
      collection: Slugs.Collections.RESOURCES,
      id,
      data: parsed.data,
      user,
      overrideAccess: false,
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      return withFormError(resultFromValidationError(error, SAVE_FAILED))
    }
    // Forbidden and NotFound too - one message, so it doesn't reveal whether the resource exists.
    payload.logger.error({ err: error }, "updateResource failed")
    return { formError: SAVE_FAILED, ok: false }
  }

  // The afterChange hook only marks these stale, so the editor would see the old text once more.
  updateTag(QueryKeys.RESOURCES.ID(id))
  updateTag(QueryKeys.RESOURCES.ROOT)

  return { ok: true }
}
