"use client"

import { updateProposalSchema } from "@repo/shared/schemas/proposals"
import type { ReactNode } from "react"
import { EditProvider, zodFormErrors } from "@/components/Editor/EditContext"
import { updateProposal } from "../../actions/postProposal"

const validateProposal = zodFormErrors(updateProposalSchema)

/** The editor wired to one proposal. Who may save is checked by updateProposal, on the server. */
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
