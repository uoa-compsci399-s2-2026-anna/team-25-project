import type { updateProposalSchema } from "@repo/shared/schemas/proposals"
import type { z } from "zod"
import { createEditFields } from "@/components/Editor/createEditFields"

/** Every proposal attribute an Edit component can bind to, keyed by form field name. */
export type ProposalValues = z.input<typeof updateProposalSchema>

/** The Edit controls for a proposal, e.g. <ProposalEdit.Input name="title" />. */
export const ProposalEdit = createEditFields<ProposalValues>()
