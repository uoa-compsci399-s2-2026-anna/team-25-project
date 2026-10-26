"use client"

import { Routes } from "@/lib/routes"
import { deleteCourse } from "../actions/deleteCourse"
import { deleteOffering } from "../actions/deleteOffering"
import { ConfirmDeleteButton } from "./ConfirmDeleteButton"

// Aliased as the React compiler rule reads a capitalized call inside a component as
// a component rendered the wrong way.
const courseHref = Routes.COURSES.COURSE

/** "Delete course", for admins (see `DeleteCourseAction`). Goes back to the courses list. */
export const DeleteCourseButton = ({ courseId, code }: { courseId: number; code: string }) => (
  <ConfirmDeleteButton
    deleted={{ description: `${code} was deleted.`, title: "Course deleted" }}
    deletedHref={Routes.COURSES.ROOT}
    description="This deletes the course and all of its offerings, published ones included. Resources linked to it are kept, without the link. This can't be undone."
    failureMessage="Could not delete this course. Try again."
    itemName={code}
    label="Delete course"
    onDelete={() => deleteCourse({ courseId })}
  />
)

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
