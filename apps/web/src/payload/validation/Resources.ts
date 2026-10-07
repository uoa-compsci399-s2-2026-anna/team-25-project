import type { RelationshipFieldSingleValidation } from "payload"
import { relationship } from "payload/shared"
import { Slugs } from "@/lib/payload/slugs"
import { canEditCourse } from "../access/Courses/Courses"
import { relationID } from "../access/Courses/helpers"

/**
 * Checks the linked course only when it changes. The field keeps `filterOptions` for the
 * picker, but the built-in check would re-run it against the stored course on every save,
 * so an owner who stops editing that course could no longer save any change to the resource.
 */
export const validateResourceCourse: RelationshipFieldSingleValidation = async (value, options) => {
  const builtIn = await relationship(value, { ...options, filterOptions: undefined })
  if (builtIn !== true) return builtIn

  const courseId = relationID(value)
  if (courseId === undefined || courseId === relationID(options.previousValue)) return true

  const { req } = options
  const course = await req.payload.findByID({
    collection: Slugs.Collections.COURSES,
    id: courseId,
    depth: 0,
    disableErrors: true,
    overrideAccess: true,
    req,
  })
  return (course && canEditCourse(req, course)) || "You can only link courses you can edit."
}
