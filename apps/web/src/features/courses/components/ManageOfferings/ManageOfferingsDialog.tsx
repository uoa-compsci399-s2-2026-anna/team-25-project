"use client"

import {
  CourseDeliveryFormatLabels,
  type CourseTerm,
  CourseTermLabels,
  derivePeriod,
} from "@repo/shared/enums/courses"
import { toSelectOptions } from "@repo/shared/utils/select-options"
import {
  CourseOfferingDialog,
  type CourseOfferingDialogValues,
  CourseOfferingsManager,
} from "@repo/ui/components/composite"
import { Button, toast } from "@repo/ui/components/ui"
import { useState } from "react"
import { createOffering } from "../../actions/createOffering"
import { deleteOffering } from "../../actions/deleteOffering"
import { updateOffering } from "../../actions/updateOffering"
import {
  blankOfferingValues,
  type ManageableOffering,
  type ManageableOfferings,
  startFromOffering,
} from "../../courses.format"
import { useCourseForm } from "../useCourseForm"

const deliveryFormatOptions = toSelectOptions(CourseDeliveryFormatLabels)
const termOptions = toSelectOptions(CourseTermLabels)

const BLANK = "blank"

// The newest published offering: the list puts unscheduled drafts first, and those
// may still be half-written. A course with no publication yet starts from its newest.
const defaultStartFrom = (offerings: ManageableOffering[]) =>
  offerings.find((other) => other.status === "published") ?? offerings[0]

type Editing = { mode: "add" } | { mode: "editDraft" | "correct"; offering: ManageableOffering }

// For the toasts: what the form says now, not what it was opened with.
const periodOf = (values: CourseOfferingDialogValues) =>
  derivePeriod({ term: (values.term || null) as CourseTerm | null, year: Number(values.year) }) ??
  "The offering"

/**
 * One offering's dialog, mounted fresh (a new `key`) each time one is opened, as
 * its form and rich-text editors only read their values on mount.
 */
function OfferingEditor({
  data,
  editing,
  open,
  onClose,
}: {
  data: ManageableOfferings
  editing: Editing
  open: boolean
  onClose: () => void
}) {
  const offering = editing.mode === "add" ? undefined : editing.offering
  const suggested = defaultStartFrom(data.offerings)
  const [startFrom, setStartFrom] = useState(
    editing.mode === "add" && suggested ? String(suggested.id) : BLANK,
  )
  // Set when the action asks for a role the dialog didn't, e.g. another tab
  // cleared the source's teaching team, so the field appears with its error.
  const [roleNeeded, setRoleNeeded] = useState(false)
  const source = data.offerings.find((other) => String(other.id) === startFrom)
  const valuesFrom = (start?: ManageableOffering) =>
    start ? startFromOffering(start) : blankOfferingValues(data.role)

  const form = useCourseForm<CourseOfferingDialogValues>({
    failureMessage:
      editing.mode === "add"
        ? "Could not add this offering. Try again."
        : "Could not save this offering. Try again.",
    initialValues: offering ? offering.values : valuesFrom(source),
    onSaved: (values, intent) => {
      const period = periodOf(values)
      toast.add(
        editing.mode === "correct"
          ? { description: `${period} was corrected.`, title: "Correction published" }
          : intent === "publish"
            ? { description: `${period} is now published.`, title: "Offering published" }
            : { description: `${period} was saved as a draft.`, title: "Draft saved" },
      )
      onClose()
    },
    remove:
      editing.mode === "editDraft"
        ? {
            action: () =>
              deleteOffering({ courseId: data.courseId, offeringId: editing.offering.id }),
            failureMessage: "Could not delete this draft. Try again.",
            onRemoved: () => {
              toast.add({
                description: `${editing.offering.period} was deleted.`,
                title: "Draft deleted",
              })
              onClose()
            },
          }
        : undefined,
    save: async (values, intent) => {
      const result = await (offering
        ? updateOffering({ ...values, courseId: data.courseId, intent, offeringId: offering.id })
        : createOffering({
            ...values,
            courseId: data.courseId,
            intent,
            startFromId: source?.id ?? null,
          }))
      if (!result.ok && result.fieldErrors?.role) setRoleNeeded(true)
      return result
    },
  })

  return (
    <CourseOfferingDialog
      {...form.dialogProps}
      deliveryFormatOptions={deliveryFormatOptions}
      mode={editing.mode}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
      open={open}
      // A new offering keeps its source's teaching team; one without a team
      // publishes with the member as its only member, so needs their role.
      showRole={
        editing.mode !== "correct" && (roleNeeded || !(offering ?? source)?.hasTeachingTeam)
      }
      startFrom={
        editing.mode === "add"
          ? {
              onValueChange: (value) => {
                setStartFrom(value)
                setRoleNeeded(false)
                form.reset(valuesFrom(data.offerings.find((other) => String(other.id) === value)))
              },
              options: [
                ...data.offerings.map((other) => ({
                  label: [
                    other.period,
                    other.status === "draft" && "(draft)",
                    other === suggested &&
                      (other.status === "published" ? "(newest published)" : "(newest)"),
                  ]
                    .filter(Boolean)
                    .join(" "),
                  value: String(other.id),
                })),
                { label: "Blank", value: BLANK },
              ],
              value: startFrom,
            }
          : undefined
      }
      termOptions={termOptions}
      title={offering && editing.mode === "correct" ? `Correct ${offering.period}` : undefined}
    />
  )
}

/**
 * Manage offerings for a course's owner and editors: the list of every offering,
 * and the dialog for adding, editing or correcting one. Opening an offering swaps
 * the list for its dialog, and closing that dialog brings the list back, refreshed
 * by the action's revalidation.
 */
export function ManageOfferingsDialog({ data }: { data: ManageableOfferings }) {
  const [managerOpen, setManagerOpen] = useState(false)
  const [editing, setEditing] = useState<Editing | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  // Remounts the editor each time, so a reopened offering starts from its saved values.
  const [editorKey, setEditorKey] = useState(0)

  const openEditor = (next: Editing) => {
    setManagerOpen(false)
    setEditing(next)
    setEditorKey((key) => key + 1)
    setEditorOpen(true)
  }

  const closeEditor = () => {
    setEditorOpen(false)
    setManagerOpen(true)
  }

  return (
    <>
      <CourseOfferingsManager
        courseCode={data.courseCode}
        items={data.offerings.map(({ detail, id, period, status }) => ({
          detail,
          id,
          period,
          status,
        }))}
        onAdd={() => openEditor({ mode: "add" })}
        onOpen={(id) => {
          const offering = data.offerings.find((other) => other.id === id)
          if (!offering) return
          openEditor({ mode: offering.status === "draft" ? "editDraft" : "correct", offering })
        }}
        onOpenChange={setManagerOpen}
        open={managerOpen}
        trigger={
          <Button borderColor="charcoal" size="sm" type="button" variant="button-transparent">
            Manage offerings
          </Button>
        }
      />
      {editing && (
        <OfferingEditor
          data={data}
          editing={editing}
          key={editorKey}
          onClose={closeEditor}
          open={editorOpen}
        />
      )}
    </>
  )
}
