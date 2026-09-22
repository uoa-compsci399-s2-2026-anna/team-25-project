import type { InstitutionCountry } from "@repo/shared/enums/institutions"
import type { Institution } from "@repo/shared/payload-types"
import type { Pagination } from "@repo/shared/types/pagination"
import { connection } from "next/server"
import type { Where } from "payload"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import type { MemberSort } from "./members.search-params"

/** Four cards across the grid's widest breakpoint, three rows of them. */
export const MEMBERS_PAGE_SIZE = 12

export type MemberFilters = {
  institutionId?: Institution["id"]
  country?: InstitutionCountry
  search?: string
  sort?: MemberSort
}

const memberFiltersToWhere = (filters: MemberFilters): Where => {
  const where: Where = {}

  const search = filters.search?.trim()
  if (search) {
    // Each word must hit a name, so "Priya Nair" matches across the two fields.
    where.and = search.split(/\s+/).map(
      (term): Where => ({
        or: [{ firstName: { contains: term } }, { lastName: { contains: term } }],
      }),
    )
  }

  if (filters.institutionId !== undefined) {
    where.institution = {
      equals: filters.institutionId,
    }
  }

  if (filters.country) {
    where["institution.country"] = {
      equals: filters.country,
    }
  }

  return where
}

/**
 * connection() because filtering on `institution` opens a Payload transaction, whose
 * randomUUID() id cacheComponents refuses to prerender. depth 1 resolves the card's data.
 */
export const getMembers = async (filters: MemberFilters, pagination: Pagination) => {
  await connection()
  const payload = await getPayloadClient()
  return payload.find({
    collection: Slugs.Collections.MEMBERS,
    ...pagination,
    depth: 1,
    // The Local API overrides access, so ask only for what the card draws rather
    // than pulling back gated fields like email.
    select: {
      avatar: true,
      firstName: true,
      institution: true,
      lastName: true,
      position: true,
    },
    sort: filters.sort === "surnameDesc" ? "-lastName" : "lastName",
    where: memberFiltersToWhere(filters),
  })
}

/** What the header reports: how many members these filters leave, out of the whole directory. */
export const getMemberCounts = async (filters: MemberFilters) => {
  await connection()
  const payload = await getPayloadClient()
  const [shown, total] = await Promise.all([
    payload.count({
      collection: Slugs.Collections.MEMBERS,
      where: memberFiltersToWhere(filters),
    }),
    payload.count({ collection: Slugs.Collections.MEMBERS }),
  ])
  return { shown: shown.totalDocs, total: total.totalDocs }
}
