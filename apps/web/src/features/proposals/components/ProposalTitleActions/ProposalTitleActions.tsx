"use client"

import { ItemActionsMenu } from "@repo/ui/components/composite"
import { toast } from "@repo/ui/components/ui"
import { useRouter } from "next/navigation"
import { useEdit } from "@/components/Editor/EditContext"
import { Routes } from "@/lib/routes"
import { deleteProposal } from "../../actions/deleteProposal"

const DELETE_FAILED = "Could not delete this proposal. Try again."

export interface ProposalTitleActionsProps {
  proposalId: number
  title: string
}

/**
 * The title row's Edit/Delete dropdown, next to the heading on the proposal's
 * own page. Edit starts the page's existing inline editor rather than
 * navigating anywhere; delete sends the viewer back to the list.
 */
export function ProposalTitleActions({ proposalId, title }: ProposalTitleActionsProps) {
  const router = useRouter()
  const { startEditing } = useEdit()

  return (
    <ItemActionsMenu
      deleteConfirmMessage="This can't be undone."
      itemLabel={title}
      onDelete={async () => {
        const result = await deleteProposal(proposalId)
        if (!result.ok) {
          toast.add({ description: result.formError ?? DELETE_FAILED, title: "Delete failed" })
          return
        }
        toast.add({ description: `"${title}" was deleted.`, title: "Proposal deleted" })
        router.push(Routes.PROPOSALS.ROOT)
      }}
      onEdit={startEditing}
    />
  )
}
