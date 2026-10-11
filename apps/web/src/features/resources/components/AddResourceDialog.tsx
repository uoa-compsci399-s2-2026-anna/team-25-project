"use client"

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/ui"
import type { ComponentProps } from "react"
import { useState } from "react"
import type { ResourceCourseOption } from "../resources.queries"
import { AddResourceForm } from "./AddResourceForm"

/**
 * The button that opens the dialog, and what stands in for it while the course options load.
 * Every prop reaches the real `<Button>`, since `DialogTrigger` clones its click handling onto it.
 */
export const AddResourceTriggerButton = (props: ComponentProps<typeof Button>) => (
  <Button className="font-bold" size="lg" type="button" variant="button-mauve" {...props}>
    + Contribute a resource
  </Button>
)

export const AddResourceDialog = ({ courses }: { courses: ResourceCourseOption[] }) => {
  const [open, setOpen] = useState(false)

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<AddResourceTriggerButton />} />
      <DialogContent
        className="max-h-[90vh] gap-0 overflow-y-auto sm:max-w-3xl"
        showCloseButton={false}
      >
        <div className="flex items-start justify-between gap-4">
          <DialogTitle className="font-bold text-2xl">Contribute a resource</DialogTitle>
          <DialogClose render={<Button size="sm" variant="button-transparent" />}>
            Cancel
          </DialogClose>
        </div>
        <AddResourceForm courses={courses} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
