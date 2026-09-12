import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/ui"
import { PostProposalForm } from "./PostProposalForm"

export const PostProposalDialog = () => {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button className="shrink-0 font-bold" size="lg" variant="button-mauve">
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
        <PostProposalForm />
      </DialogContent>
    </Dialog>
  )
}
