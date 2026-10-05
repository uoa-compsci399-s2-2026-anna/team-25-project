import { QueryKeys } from "@repo/shared/constants/query-keys"
import type { Pagination } from "@repo/shared/types/pagination"
import { cacheLife, cacheTag } from "next/cache"
import { connection } from "next/server"
import type { Sort, Where } from "payload"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import type { PublicationSort } from "./publications.search-params"
import type { PublicationFilters } from "./publications.types"

const publicationFiltersToWhere = (filters: PublicationFilters): Where => {
  const where: Where = {}

  const search = filters.search?.trim()
  if (search) {
    where.or = [
      { title: { contains: search } },
      { venue: { contains: search } },
      { abstract: { contains: search } },
      { "authors.name": { contains: search } },
    ]
  }

  if (filters.type) {
    where.type = {
      equals: filters.type,
    }
  }

  if (filters.year !== undefined) {
    where.year = {
      equals: filters.year,
    }
  }

  if (filters.tags?.length) {
    where.tags = {
      in: filters.tags,
    }
  }

  return where
}

// id breaks ties; without it paging can repeat or skip a publication.
const publicationSortFields: Record<PublicationSort, Sort> = {
  newest: ["-year", "-month", "-id"],
  oldest: ["year", "month", "id"],
  titleAsc: ["title", "id"],
}

export const getPublications = async (filters: PublicationFilters, pagination: Pagination) => {
  const payload = await getPayloadClient()
  return payload.find({
    collection: Slugs.Collections.PUBLICATIONS,
    ...pagination,
    // Depth 2 reaches the avatar of each author who is a member.
    depth: 2,
    // The Local API overrides access, so ask only for what the card draws of a member.
    populate: { [Slugs.Collections.MEMBERS]: { avatar: true } },
    sort: publicationSortFields[filters.sort ?? "newest"],
    where: publicationFiltersToWhere(filters),
  })
}

const getPublicationsCached = async (filters: PublicationFilters, pagination: Pagination) => {
  "use cache"
  cacheLife("max")
  // The cards show member avatars, so the list goes stale with the members too.
  cacheTag(QueryKeys.PUBLICATIONS.ROOT, QueryKeys.MEMBERS.ROOT)
  return getPublications(filters, pagination)
}

// Free text has unbounded keys and few repeat hits, so only views without a search or tags are cached.
const hasFreeText = (filters: Pick<PublicationFilters, "search" | "tags">) =>
  Boolean(filters.search?.trim() || filters.tags?.length)

/** Loads one page of publications, cached unless the filters include a search or tags. */
export const loadPublicationsPage = async (filters: PublicationFilters, pagination: Pagination) => {
  if (!hasFreeText(filters)) return getPublicationsCached(filters, pagination)

  // connection() because filtering on `tags` joins under a randomUUID() alias, which
  // cacheComponents refuses to prerender. It stays out of getPublications, which "use cache" also runs.
  await connection()
  return getPublications(filters, pagination)
}

/** Every year that has a publication, newest first, for the year filter. */
export const getPublicationYears = async (): Promise<number[]> => {
  const payload = await getPayloadClient()
  const { values } = await payload.findDistinct({
    collection: Slugs.Collections.PUBLICATIONS,
    field: "year",
    // 0 turns paging off, so no year is left out.
    limit: 0,
    sort: "-year",
  })
  return values.map(({ year }) => year)
}

export const getPublicationYearsCached = async () => {
  "use cache"
  cacheLife("max")
  cacheTag(QueryKeys.PUBLICATIONS.ROOT)
  return getPublicationYears()
}

/** Every tag that a publication has, in alphabetical order, for the tags filter. */
export const getPublicationTags = async (): Promise<string[]> => {
  const payload = await getPayloadClient()
  const { values } = await payload.findDistinct({
    collection: Slugs.Collections.PUBLICATIONS,
    field: "tags",
    // 0 turns paging off, so no tag is left out.
    limit: 0,
    sort: "tags",
  })
  // Each value holds one tag, not the array its type claims, or null for a publication with no tags.
  return values.flatMap(({ tags }) => tags ?? [])
}

export const getPublicationTagsCached = async () => {
  "use cache"
  cacheLife("max")
  cacheTag(QueryKeys.PUBLICATIONS.ROOT)
  return getPublicationTags()
}
