"use client"

import { Routes } from "@/lib/routes"
import { deleteCourse } from "../actions/deleteCourse"
import { ConfirmDeleteButton } from "./ConfirmDeleteButton"

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
