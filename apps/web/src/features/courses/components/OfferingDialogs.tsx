"use client"

import { CourseDeliveryFormat, CourseDeliveryFormatLabels } from "@repo/shared/enums/courses"
import { Button, toast } from "@repo/ui/components/ui"
import { type ReactElement, useState } from "react"
import { createOffering } from "../actions/createOffering"
import { deleteDraftOffering } from "../actions/deleteDraftOffering"
import { searchMembers } from "../actions/searchMembers"
import { updateDraftOffering } from "../actions/updateDraftOffering"
import { updateOffering } from "../actions/updateOffering"
import {
  AddCapstoneCourseDialog,
  type AddCapstoneCourseDialogValues,
  type TeachingTeamRow,
} from "./AddCapstoneCourseDialog"
import { useCourseForm } from "./useCourseForm"

const deliveryFormatOptions = Object.values(CourseDeliveryFormat).map((value) => ({
  label: CourseDeliveryFormatLabels[value],
  value,
}))

export interface OfferingTeam {
  rows: TeachingTeamRow[]
  /** Only the course's owner and editors may change it - teaching staff see it read-only. */
  editable: boolean
}

/** The dialog's teaching-team section, and what the save sends for it. */
function useTeachingTeam(team: OfferingTeam) {
  const [rows, setRows] = useState(team.rows)
  const [changed, setChanged] = useState(false)
  return {
    reset: () => {
      setRows(team.rows)
      setChanged(false)
    },
    dialogProps: {
      onChange: team.editable
        ? (next: TeachingTeamRow[]) => {
            setRows(next)
            setChanged(true)
          }
        : undefined,
      onSearch: searchMembers,
      rows,
    },
    // Without a change the save sends no team, so the offering keeps the stored one.
    // Sending the team the dialog loaded with could undo another editor's change.
    input: changed ? rows.map(({ member, role }) => ({ member: member.id, role })) : undefined,
  }
}

export interface AddOfferingDialogProps {
  courseId: number
  /** The offering the dialog is filled in from, teaching team included. */
  sourceId: number
  initialValues: AddCapstoneCourseDialogValues
  team: OfferingTeam
}

export function AddOfferingDialog({
  courseId,
  sourceId,
  initialValues,
  team,
}: AddOfferingDialogProps) {
  const [open, setOpen] = useState(false)
  const teachingTeam = useTeachingTeam(team)
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
    save: (values, intent) =>
      createOffering({ ...values, courseId, intent, sourceId, teachingTeam: teachingTeam.input }),
  })

  // Reopening always starts again from the current offering.
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      form.reset(initialValues)
      teachingTeam.reset()
    }
  }

  return (
    <AddCapstoneCourseDialog
      {...form.dialogProps}
      deliveryFormatOptions={deliveryFormatOptions}
      kind="offering"
      onOpenChange={handleOpenChange}
      open={open}
      teachingTeam={teachingTeam.dialogProps}
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
  team: OfferingTeam
}

/** Corrects a published offering in place. Saving puts the change live at once. */
export function EditOfferingDialog({
  courseId,
  offeringId,
  initialValues,
  team,
}: EditOfferingDialogProps) {
  const [open, setOpen] = useState(false)
  const teachingTeam = useTeachingTeam(team)
  const form = useCourseForm({
    failureMessage: "Could not save this offering. Try again.",
    initialValues,
    onSaved: (values) => {
      toast.add({ description: `${values.period} was updated.`, title: "Offering updated" })
      setOpen(false)
    },
    save: (values) =>
      updateOffering({ ...values, courseId, offeringId, teachingTeam: teachingTeam.input }),
  })

  // Reopening starts again from the offering as it's saved, dropping unsaved edits.
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      form.reset(initialValues)
      teachingTeam.reset()
    }
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
      teachingTeam={teachingTeam.dialogProps}
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
  team: OfferingTeam
  /** Only the course's owner and editors may delete a draft, not its teaching staff. */
  canDelete: boolean
  /** The draft's row in the sidebar, which opens the dialog. */
  trigger: ReactElement
}

/** Reopens a draft offering to keep working on it, publish it or delete it. */
export function EditDraftOfferingDialog({
  courseId,
  offeringId,
  initialValues,
  team,
  canDelete,
  trigger,
}: EditDraftOfferingDialogProps) {
  const [open, setOpen] = useState(false)
  const teachingTeam = useTeachingTeam(team)
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
    remove: canDelete
      ? {
          action: () => deleteDraftOffering({ courseId, offeringId }),
          failureMessage: "Could not delete this draft. Try again.",
          onRemoved: () => {
            toast.add({ description: "The draft offering was deleted.", title: "Draft deleted" })
            setOpen(false)
          },
        }
      : undefined,
    save: (values, intent) =>
      updateDraftOffering({
        ...values,
        courseId,
        intent,
        offeringId,
        teachingTeam: teachingTeam.input,
      }),
  })

  // Reopening starts again from the draft as it's saved, dropping unsaved edits.
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      form.reset(initialValues)
      teachingTeam.reset()
    }
  }

  return (
    <AddCapstoneCourseDialog
      {...form.dialogProps}
      deliveryFormatOptions={deliveryFormatOptions}
      kind="draft"
      onOpenChange={handleOpenChange}
      open={open}
      teachingTeam={teachingTeam.dialogProps}
      trigger={trigger}
    />
  )
}
