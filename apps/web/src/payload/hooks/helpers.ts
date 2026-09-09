import { AsyncLocalStorage } from "node:async_hooks"
import type { Course } from "@repo/shared/payload-types"
import { APIError, type PayloadRequest } from "payload"
import { lockDocument } from "@/lib/payload/lock"
import { Slugs } from "@/lib/payload/slugs"
import { canEditCourse } from "../access/Courses/Courses"
import { relationID } from "../access/Courses/helpers"

// This guard is private to the server and to the nested operation's async scope.
// Concurrent work on the same request cannot inherit permission to change metadata.
export const internal = new AsyncLocalStorage<boolean>()

export const isInternal = () => internal.getStore() === true

export const versionMetadataKeys = ["publishedAt", "publishedBy", "displaySnapshot"] as const

export type VersionMetadataKey = (typeof versionMetadataKeys)[number]

// beforeValidate sees `data` only after Payload's field pass, which cannot see the
// operation's `draft` flag and fills every configured group with `{}`. That fill
// erases the difference between a key the caller sent and one Payload invented, so
// beforeOperation records the raw request first. It is overwritten on every write,
// so a caller-supplied context value never survives to be read.
export const VERSION_WRITE = "courseVersionWrite"

export type VersionWrite = {
  draft: boolean
  sentMetadataKeys: ReadonlySet<VersionMetadataKey>
}

export function fail(message: string, status = 400): never {
  throw new APIError(message, status)
}

export function requireID(value: unknown): number {
  const id = relationID(value)
  if (!id) fail("A valid relationship is required.")
  return id
}

export const lockCourse = (req: PayloadRequest, id: number | undefined) =>
  lockDocument<Course>(req, Slugs.Collections.COURSES, id)

export function requireEditor(req: PayloadRequest, course: Course) {
  if (!canEditCourse(req, course)) fail("You cannot edit this course.", 403)
}
