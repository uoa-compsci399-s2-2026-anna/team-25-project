import type { CourseVersion } from "@repo/shared/payload-types"
import type { CollectionBeforeOperationHook } from "payload"
import { Slugs } from "@/lib/payload/slugs"
import { relationID } from "../access/Courses/helpers"
import {
  fail,
  isInternal,
  lockCourse,
  requireEditor,
  requireID,
  VERSION_WRITE,
  type VersionWrite,
  versionMetadataKeys,
} from "./helpers"

// The gate every course write passes through: it refuses restores and bulk writes,
// authorizes the caller, and records the raw request body before Payload rewrites it.
// All of that runs on the course row lock, taken here because beforeOperation is the
// last point before Payload reads update snapshots or fills omitted fields. Both course
// collections share the hook, so a write to either takes the same course lock.
export const guardCourseWrite: CollectionBeforeOperationHook = async ({
  args,
  operation,
  collection,
  req,
}) => {
  if (isInternal()) return args

  // Restoring writes a revision back without the publication checks below.
  // Editors apply an old revision by saving its content as a draft instead.
  if (operation === "restoreVersion")
    fail("Restoring a revision is not supported. Save its content as a draft and publish it.", 409)

  // Payload bulk operations catch individual errors and can commit partial work.
  // Require one record per write so a publication always has full rollback.
  if ((operation === "update" || operation === "delete") && !("id" in args && args.id))
    fail("Use a record ID for course writes. Bulk writes are not supported.")

  if (operation !== "create" && operation !== "update") return args

  const isVersion = collection.slug === Slugs.Collections.COURSE_VERSIONS
  if (isVersion) {
    // `key in sent` is the whole point of recording this here: it stays true for an
    // explicit `{ displaySnapshot: null }` and false for a key the caller omitted.
    const sent = ("data" in args ? args.data : undefined) as Partial<CourseVersion> | undefined
    req.context[VERSION_WRITE] = {
      // Payload reads this flag for truthiness, so this must too. The REST layer has
      // already narrowed the query string to a boolean by here; matching on the string
      // "true" instead would call a Local API `draft: 1` a publication.
      draft: Boolean("draft" in args && args.draft),
      sentMetadataKeys: new Set(
        versionMetadataKeys.filter((key) => sent !== undefined && key in sent),
      ),
    } satisfies VersionWrite
  }

  if (operation === "create") {
    // Duplicating copies the source offering's period and dates into a second document
    // for the same teaching period, and merges them in after this hook, so the course
    // to authorize against is not in `args` yet. Refuse it rather than half-support it.
    if ("duplicateFromID" in args && args.duplicateFromID)
      fail("Duplicating an offering is not supported. Create one for the new period.", 409)

    if (!isVersion || !("data" in args)) return args
    const data = args.data as Partial<CourseVersion>
    requireEditor(req, await lockCourse(req, relationID(data.course)))
    return args
  }

  if (!("id" in args) || !args.id) return args

  const doc = await req.payload.findByID({
    collection: isVersion ? Slugs.Collections.COURSE_VERSIONS : Slugs.Collections.COURSES,
    id: requireID(args.id),
    depth: 0,
    req,
    overrideAccess: true,
  })

  const id = isVersion ? relationID((doc as CourseVersion).course) : doc.id
  requireEditor(req, await lockCourse(req, id))

  return args
}
