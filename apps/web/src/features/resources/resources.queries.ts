import { QueryKeys } from "@repo/shared/constants/query-keys"
import type { Course } from "@repo/shared/payload-types"
import type { Pagination } from "@repo/shared/types/pagination"
import { cacheLife, cacheTag } from "next/cache"
import { connection } from "next/server"
import type { Sort, Where } from "payload"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import type { ResourceSort } from "./resources.search-params"
import type { ResourceFilters } from "./resources.types"

const resourceFiltersToWhere = (filters: ResourceFilters): Where => {
  const where: Where = {}

  // The description is rich text, stored as JSON that Postgres will not match text against.
  const search = filters.search?.trim()
  if (search) {
    where.or = [
      { title: { contains: search } },
      { "owner.firstName": { contains: search } },
      { "owner.lastName": { contains: search } },
    ]
  }

  if (filters.courseId !== undefined) {
    where.course = {
      equals: filters.courseId,
    }
  }

  if (filters.institutionId !== undefined) {
    where["owner.institution"] = {
      equals: filters.institutionId,
    }
  }

  return where
}

// id breaks ties; without it paging can repeat or skip a resource.
const resourceSortFields: Record<ResourceSort, Sort> = {
  newest: ["-createdAt", "-id"],
  oldest: ["createdAt", "id"],
  titleAsc: ["title", "id"],
}

export const getResources = async (filters: ResourceFilters, pagination: Pagination) => {
  const payload = await getPayloadClient()
  return payload.find({
    collection: Slugs.Collections.RESOURCES,
    ...pagination,
    // Depth 2 reaches the owner's avatar.
    depth: 2,
    // The Local API overrides access, so ask only for what the card draws.
    populate: {
      [Slugs.Collections.COURSES]: { code: true },
      [Slugs.Collections.MEMBERS]: { avatar: true, firstName: true, lastName: true },
    },
    select: { course: true, createdAt: true, description: true, owner: true, title: true },
    sort: resourceSortFields[filters.sort ?? "newest"],
    where: resourceFiltersToWhere(filters),
  })
}

const getResourcesCached = async (filters: ResourceFilters, pagination: Pagination) => {
  "use cache"
  cacheLife("max")
  // The cards show owner names and avatars and course codes, so the list goes stale with them too.
  cacheTag(QueryKeys.RESOURCES.ROOT, QueryKeys.MEMBERS.ROOT, QueryKeys.COURSES.ROOT)
  return getResources(filters, pagination)
}

// Free-text search has unbounded keys and few repeat hits, so only non-search views are cached.
const hasSearch = (filters: Pick<ResourceFilters, "search">) => Boolean(filters.search?.trim())

/** Loads one page of resources, cached unless the filters include a search. */
export const loadResourcesPage = async (filters: ResourceFilters, pagination: Pagination) => {
  if (!hasSearch(filters)) return getResourcesCached(filters, pagination)

  // connection() because searching on the owner's name joins under a randomUUID() alias, which
  // cacheComponents refuses to prerender. It stays out of getResources, which "use cache" also runs.
  await connection()
  return getResources(filters, pagination)
}

export const getResourceById = async (id: number) => {
  const payload = await getPayloadClient()
  return payload.findByID({
    collection: Slugs.Collections.RESOURCES,
    id,
    // Depth 2 reaches the owner's avatar and institution, and the course's institution.
    depth: 2,
    disableErrors: true,
    // The Local API overrides access, so ask only for what the page draws.
    populate: {
      [Slugs.Collections.COURSES]: { code: true, hasPublishedVersion: true, institution: true },
      [Slugs.Collections.INSTITUTIONS]: { name: true },
      [Slugs.Collections.MEMBERS]: {
        avatar: true,
        firstName: true,
        institution: true,
        lastName: true,
      },
      [Slugs.Collections.RESOURCE_ATTACHMENTS]: {
        filename: true,
        filesize: true,
        mimeType: true,
        url: true,
      },
    },
  })
}

export const getResourceByIdCached = async (id: number) => {
  "use cache"
  cacheLife("max")
  // The page shows the owner, the course and their institutions, so it goes stale with them too.
  // The root tag is how a replaced or deleted attachment reaches it (see revalidateAttachmentResources).
  cacheTag(
    QueryKeys.RESOURCES.ROOT,
    QueryKeys.RESOURCES.ID(id),
    QueryKeys.MEMBERS.ROOT,
    QueryKeys.COURSES.ROOT,
    QueryKeys.INSTITUTIONS,
  )
  return getResourceById(id)
}

/** A course's newest resources, up to `limit`, with the total so the page can link to the rest. */
export const getCourseResources = async (courseId: number, limit: number) => {
  const payload = await getPayloadClient()
  const { docs, totalDocs } = await payload.find({
    collection: Slugs.Collections.RESOURCES,
    // Depth 2 reaches each owner's avatar.
    depth: 2,
    limit,
    // The course is the page's own, so the cards leave it out.
    populate: {
      [Slugs.Collections.MEMBERS]: { avatar: true, firstName: true, lastName: true },
    },
    select: { createdAt: true, description: true, owner: true, title: true },
    sort: ["-createdAt", "-id"],
    where: { course: { equals: courseId } },
  })
  return { resources: docs, total: totalDocs }
}

export const getCourseResourcesCached = async (courseId: number, limit: number) => {
  "use cache"
  cacheLife("max")
  // The cards show owner names and avatars, so they go stale with the members too.
  cacheTag(QueryKeys.RESOURCES.ROOT, QueryKeys.MEMBERS.ROOT)
  return getCourseResources(courseId, limit)
}

export type ResourceCourseOption = { value: Course["id"]; label: string }

const toCourseOption = ({
  code,
  id,
  institution,
}: Pick<Course, "code" | "id" | "institution">): ResourceCourseOption => ({
  label: typeof institution === "object" ? `${code} - ${institution.name}` : code,
  value: id,
})

/**
 * Every course that has a resource, for the course filter. Codes repeat across
 * universities, so each label carries its university.
 */
export const getResourceCourseOptions = async (): Promise<ResourceCourseOption[]> => {
  const payload = await getPayloadClient()
  const { values } = await payload.findDistinct({
    collection: Slugs.Collections.RESOURCES,
    depth: 0,
    field: "course",
    // 0 turns paging off, so no course is left out.
    limit: 0,
  })
  const courseIds = values.flatMap(({ course }) => (typeof course === "number" ? [course] : []))
  if (courseIds.length === 0) return []

  const { docs } = await payload.find({
    collection: Slugs.Collections.COURSES,
    depth: 1,
    pagination: false,
    populate: { [Slugs.Collections.INSTITUTIONS]: { name: true } },
    select: { code: true, institution: true },
    sort: "code",
    where: { id: { in: courseIds } },
  })
  return docs.map(toCourseOption)
}

export const getResourceCourseOptionsCached = async () => {
  "use cache"
  cacheLife("max")
  cacheTag(QueryKeys.RESOURCES.ROOT, QueryKeys.COURSES.ROOT, QueryKeys.INSTITUTIONS)
  return getResourceCourseOptions()
}

/**
 * The courses a member can link a resource to: the ones they own or edit, as `courseWrite`
 * allows. Per member, so left uncached and read inside a request.
 */
export const getEditableCourseOptions = async (
  memberId: number,
): Promise<ResourceCourseOption[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: Slugs.Collections.COURSES,
    depth: 1,
    pagination: false,
    populate: { [Slugs.Collections.INSTITUTIONS]: { name: true } },
    select: { code: true, institution: true },
    sort: "code",
    where: { or: [{ owner: { equals: memberId } }, { editors: { contains: memberId } }] },
  })
  return docs.map(toCourseOption)
}
