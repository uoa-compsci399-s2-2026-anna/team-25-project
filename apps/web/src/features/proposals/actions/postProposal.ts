"use server"

import { QueryKeys } from "@repo/shared/constants/query-keys"
import { ProposalStatus } from "@repo/shared/enums/proposals"
import { postProposalFormSchema } from "@repo/shared/schemas/proposals"
import { updateTag } from "next/cache"
import { ValidationError } from "payload"
import type { ActionResult } from "@/features/auth/actions/types"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import { fieldErrorsFromIssues, resultFromValidationError } from "./validationErrors"

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

  updateTag(QueryKeys.PROPOSALS.ROOT)

  return { ok: true }
}
