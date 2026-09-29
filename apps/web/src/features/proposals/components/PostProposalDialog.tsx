"use client"

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/ui"
import { useState } from "react"
import { PostProposalForm } from "./PostProposalForm"

export const PostProposalDialog = () => {
  const [open, setOpen] = useState(false)

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        render={
          <Button className="font-bold" size="lg" variant="button-mauve">
            + Post a proposal
          </Button>
        }
      />
      <DialogContent
        className="max-h-[90vh] gap-0 overflow-y-auto sm:max-w-3xl"
        showCloseButton={false}
      >
        <div className="flex items-start justify-between gap-4">
          <DialogTitle className="font-bold text-2xl">Post a new proposal</DialogTitle>
          <DialogClose render={<Button size="sm" variant="button-transparent" />}>
            Cancel
          </DialogClose>
        </div>
        <PostProposalForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
