import type { Course } from "@repo/shared/payload-types"
import { connection } from "next/server"
import type { ReactNode } from "react"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import { getEditableCourseOptions, toCourseOption } from "../../resources.queries"
import { ResourceEdit } from "./resourceEditFields"

/**
 * The course picker, with the viewer's own courses as its options - so it reads the
 * signed-in user and belongs behind a Suspense boundary, like ResourceEditButton.
 */
export const ResourceCourseEdit = async ({
  course,
  view,
}: {
  /** The linked course, populated with its university. */
  course: Course | null | undefined
  view: ReactNode
}) => {
  // Marks this boundary dynamic during prerendering, and lets the course query's
  // `editors` join take its random table alias.
  await connection()
  const { collection, user } = await getCurrentUser()
  // Admins own no courses, as in the add form, so they can only keep or clear the link.
  const editable =
    collection === Slugs.Collections.MEMBERS ? await getEditableCourseOptions(user.id) : []

  // The linked course stays listed even once the viewer can't edit it, so opening the
  // editor doesn't show "No course" and unlink it on save. Payload only checks a changed link.
  const options =
    course && !editable.some((option) => option.value === course.id)
      ? [toCourseOption(course), ...editable]
      : editable

  return (
    <ResourceEdit.Select
      label="Course"
      name="course"
      nullLabel="No course"
      options={options}
      value={course?.id ?? null}
      view={view}
    />
  )
}
