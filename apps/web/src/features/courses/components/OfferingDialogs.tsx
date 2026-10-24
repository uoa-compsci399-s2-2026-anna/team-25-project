"use client"

import { CourseDeliveryFormat, CourseDeliveryFormatLabels } from "@repo/shared/enums/courses"
import {
  AddCapstoneCourseDialog,
  type AddCapstoneCourseDialogValues,
} from "@repo/ui/components/composite"
import { Button, toast } from "@repo/ui/components/ui"
import { type ReactElement, useState } from "react"
import { createOffering } from "../actions/createOffering"
import { deleteDraftOffering } from "../actions/deleteDraftOffering"
import { updateDraftOffering } from "../actions/updateDraftOffering"
import { updateOffering } from "../actions/updateOffering"
import { useCourseForm } from "./useCourseForm"

const deliveryFormatOptions = Object.values(CourseDeliveryFormat).map((value) => ({
  label: CourseDeliveryFormatLabels[value],
  value,
}))

export interface AddOfferingDialogProps {
  courseId: number
  /** The offering the dialog is filled in from, whose teaching team the new one keeps. */
  sourceId: number
  initialValues: AddCapstoneCourseDialogValues
}

export function AddOfferingDialog({ courseId, sourceId, initialValues }: AddOfferingDialogProps) {
  const [open, setOpen] = useState(false)
  const form = useCourseForm({
    failureMessage: "Could not add this offering. Try again.",
    initialValues,
    onSaved: (values, intent) => {
      toast.add(
        intent === "publish"
          ? { description: `${values.period} is now published.`, title: "Offering added" }
          : { description: "It's listed under Drafts on this page.", title: "Draft saved" },
      )
      setOpen(false)
    },
    save: (values, intent) => createOffering({ ...values, courseId, intent, sourceId }),
  })

  // Reopening always starts again from the current offering.
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) form.reset(initialValues)
  }

  return (
    <AddCapstoneCourseDialog
      {...form.dialogProps}
      deliveryFormatOptions={deliveryFormatOptions}
      kind="offering"
      onOpenChange={handleOpenChange}
      open={open}
      trigger={
        <Button className="font-bold" size="sm" type="button" variant="button-mauve">
          + Add offering
        </Button>
      }
    />
  )
}

export interface EditOfferingDialogProps {
  courseId: number
  offeringId: number
  initialValues: AddCapstoneCourseDialogValues
}

/** Corrects a published offering in place. Saving puts the change live at once. */
export function EditOfferingDialog({
  courseId,
  offeringId,
  initialValues,
}: EditOfferingDialogProps) {
  const [open, setOpen] = useState(false)
  const form = useCourseForm({
    failureMessage: "Could not save this offering. Try again.",
    initialValues,
    onSaved: (values) => {
      toast.add({ description: `${values.period} was updated.`, title: "Offering updated" })
      setOpen(false)
    },
    save: (values) => updateOffering({ ...values, courseId, offeringId }),
  })

  // Reopening starts again from the offering as it's saved, dropping unsaved edits.
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) form.reset(initialValues)
  }

  return (
    <AddCapstoneCourseDialog
      {...form.dialogProps}
      deliveryFormatOptions={deliveryFormatOptions}
      kind="correction"
      onOpenChange={handleOpenChange}
      // A draft over a published offering would be a pending edit nobody can see.
      onSaveDraft={undefined}
      open={open}
      trigger={
        <Button
          borderColor="charcoal"
          className="font-bold"
          size="sm"
          type="button"
          variant="button-transparent"
        >
          Edit offering
        </Button>
      }
    />
  )
}

export interface EditDraftOfferingDialogProps {
  courseId: number
  offeringId: number
  initialValues: AddCapstoneCourseDialogValues
  /** The draft's row in the sidebar, which opens the dialog. */
  trigger: ReactElement
}

/** Reopens a draft offering to keep working on it, publish it or delete it. */
export function EditDraftOfferingDialog({
  courseId,
  offeringId,
  initialValues,
  trigger,
}: EditDraftOfferingDialogProps) {
  const [open, setOpen] = useState(false)
  const form = useCourseForm({
    failureMessage: "Could not save this draft. Try again.",
    initialValues,
    onSaved: (values, intent) => {
      toast.add(
        intent === "publish"
          ? { description: `${values.period} is now published.`, title: "Offering published" }
          : { description: "Your changes were saved.", title: "Draft saved" },
      )
      setOpen(false)
    },
    remove: {
      action: () => deleteDraftOffering({ courseId, offeringId }),
      failureMessage: "Could not delete this draft. Try again.",
      onRemoved: () => {
        toast.add({ description: "The draft offering was deleted.", title: "Draft deleted" })
        setOpen(false)
      },
    },
    save: (values, intent) => updateDraftOffering({ ...values, courseId, intent, offeringId }),
  })

  // Reopening starts again from the draft as it's saved, dropping unsaved edits.
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) form.reset(initialValues)
  }

  return (
    <AddCapstoneCourseDialog
      {...form.dialogProps}
      deliveryFormatOptions={deliveryFormatOptions}
      kind="draft"
      onOpenChange={handleOpenChange}
      open={open}
      trigger={trigger}
    />
  )
}
