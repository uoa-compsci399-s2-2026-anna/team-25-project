"use client"

import { Routes } from "@/lib/routes"
import { deleteOffering } from "../actions/deleteOffering"
import { ConfirmDeleteButton } from "./ConfirmDeleteButton"

// Aliased as the React compiler rule reads a capitalized call inside a component as
// a component rendered the wrong way.
const courseHref = Routes.COURSES.COURSE

/**
 * "Delete offering", for the course's owner (see `OfferingActions`). Goes back to the
 * course page without the deleted offering in its URL, so it shows the current one.
 */
export const DeleteOfferingButton = ({
  courseId,
  offeringId,
  period,
}: {
  courseId: number
  offeringId: number
  /** The offering's teaching period, e.g. "Semester 1 2026". */
  period: string
}) => (
  <ConfirmDeleteButton
    deleted={{ description: `${period} was deleted.`, title: "Offering deleted" }}
    deletedHref={courseHref(courseId)}
    description="This deletes the offering and its history. The course and its other offerings stay. This can't be undone."
    failureMessage="Could not delete this offering. Try again."
    itemName={period}
    label="Delete offering"
    onDelete={() => deleteOffering({ courseId, offeringId })}
  />
)
