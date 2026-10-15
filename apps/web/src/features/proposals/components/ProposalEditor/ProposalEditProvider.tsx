"use client"

import { updateProposalSchema } from "@repo/shared/schemas/proposals"
import type { ReactNode } from "react"
import { EditProvider, zodFormErrors } from "@/components/Editor/EditContext"
import { updateProposal } from "../../actions/updateProposal"

const validateProposal = zodFormErrors(updateProposalSchema)

/**
 * The editor wired to one proposal: checked against updateProposalSchema, saved via
 * updateProposal. Who may save is decided on the server, not by who sees the Edit button.
 */
export const ProposalEditProvider = ({
  children,
  proposalId,
}: {
  children: ReactNode
  proposalId: number
}) => (
  <EditProvider onSave={(values) => updateProposal(proposalId, values)} validate={validateProposal}>
    {children}
  </EditProvider>
)
