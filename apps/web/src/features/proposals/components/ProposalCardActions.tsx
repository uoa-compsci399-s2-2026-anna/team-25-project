"use client"

import { ItemActionsMenu } from "@repo/ui/components/composite"
import { toast } from "@repo/ui/components/ui"
import type { Route } from "next"
import { useRouter } from "next/navigation"
import { deleteProposal } from "../actions/deleteProposal"

const DELETE_FAILED = "Could not delete this proposal. Try again."

export interface ProposalCardActionsProps {
  proposalId: number
  title: string
  /**
   * Where Edit sends the viewer - the proposal's page, with its editor open.
   * `typedRoutes` rejects a plain `string` prop type here since the hash this
   * is built with isn't a route Next can see statically, hence the cast below.
   */
  editHref: string
}

/**
 * The proposals list card's Edit/Delete dropdown. Only rendered for the
 * proposal's own authors and admins - the same rule that already gates
 * editing, now also gating delete.
 */
export function ProposalCardActions({ proposalId, title, editHref }: ProposalCardActionsProps) {
  const router = useRouter()

  return (
    <ItemActionsMenu
      deleteConfirmMessage="This can't be undone."
      itemLabel={title}
      onDelete={async () => {
        try {
          const result = await deleteProposal(proposalId)
          if (!result.ok) {
            toast.add({ description: result.formError ?? DELETE_FAILED, title: "Delete failed" })
            return
          }
          toast.add({ description: `"${title}" was deleted.`, title: "Proposal deleted" })
          router.refresh()
        } catch (error) {
          console.error("deleteProposal failed", error)
          toast.add({ description: DELETE_FAILED, title: "Delete failed" })
        }
      }}
      onEdit={() => router.push(editHref as Route)}
    />
  )
}
