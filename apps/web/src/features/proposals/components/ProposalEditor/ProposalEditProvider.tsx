"use client"

import { updateProposalSchema } from "@repo/shared/schemas/proposals"
import type { ReactNode } from "react"
import { updateProposal } from "../../actions/updateProposal"
import { ProposalEdit } from "./proposalEditFields"

/** The editor wired to one proposal. Who may save is checked by updateProposal, on the server. */
export const ProposalEditProvider = ({
  children,
  proposalId,
}: {
  children: ReactNode
  proposalId: number
}) => (
  <ProposalEdit.Provider
    onSave={(values) => updateProposal(proposalId, values)}
    schema={updateProposalSchema}
  >
    {children}
  </ProposalEdit.Provider>
)
