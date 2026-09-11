import { QueryKeys } from "@repo/shared/constants/query-keys"
import { ProposalStatus, type ProposalTag } from "@repo/shared/enums/proposals"
import type { Institution } from "@repo/shared/payload-types"
import type { Pagination } from "@repo/shared/types/pagination"
import { cacheLife, cacheTag } from "next/cache"
import type { Where } from "payload"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import type { ProposalSort } from "./proposals.search-params"

export type ProposalFilters = {
  institutionId?: Institution["id"]
  tag?: ProposalTag
  search?: string
  sort?: ProposalSort
  status?: ProposalStatus
}

const proposalFiltersToWhere = (filters: ProposalFilters): Where => {
  const where: Where = {}

  if (filters.status) {
    where.status = {
      equals: filters.status,
    }
  }

  const search = filters.search?.trim()
  if (search) {
    where.or = [{ title: { contains: search } }, { summary: { contains: search } }]
  }

  if (filters.institutionId !== undefined) {
    where["author.institution"] = {
      equals: filters.institutionId,
    }
  }

  if (filters.tag) {
    where.tags = {
      in: [filters.tag],
    }
  }

  return where
}

export const getProposals = async (filters: ProposalFilters, pagination: Pagination) => {
  const payload = await getPayloadClient()
  return payload.find({
    collection: Slugs.Collections.PROPOSALS,
    ...pagination,
    sort: filters.sort === "oldest" ? "createdAt" : "-createdAt",
    where: proposalFiltersToWhere(filters),
  })
}

const getProposalsCached = async (filters: ProposalFilters, pagination: Pagination) => {
  "use cache"
  cacheLife("max")
  cacheTag(QueryKeys.PROPOSALS)
  return getProposals(filters, pagination)
}
/** Filters relevant to status counts: `status` is overwritten per tab and `sort` never affects a count. */
type ProposalStatusCountFilters = Omit<ProposalFilters, "status" | "sort">

/** Counts per status under the other filters, so each status tab shows what it would list. */
export const getProposalStatusCounts = async (
  filters: ProposalStatusCountFilters,
): Promise<Record<ProposalStatus, number>> => {
  const payload = await getPayloadClient()
  const entries = await Promise.all(
    Object.values(ProposalStatus).map(async (status) => {
      const { totalDocs } = await payload.count({
        collection: Slugs.Collections.PROPOSALS,
        where: proposalFiltersToWhere({ ...filters, status }),
      })
      return [status, totalDocs] as const
    }),
  )
  return Object.fromEntries(entries) as Record<ProposalStatus, number>
}

const getProposalStatusCountsCached = async (filters: ProposalStatusCountFilters) => {
  "use cache"
  cacheLife("max")
  cacheTag(QueryKeys.PROPOSALS)
  return getProposalStatusCounts(filters)
}

// Free-text search has unbounded keys and few repeat hits, so only non-search views are cached.
const hasSearch = (filters: Pick<ProposalFilters, "search">) => Boolean(filters.search?.trim())

/** Loads one page of proposals, cached unless the filters include a search. */
export const loadProposalsPage = (filters: ProposalFilters, pagination: Pagination) =>
  hasSearch(filters) ? getProposals(filters, pagination) : getProposalsCached(filters, pagination)

/** Loads the status counts, cached unless the filters include a search. */
export const loadProposalStatusCounts = (filters: ProposalStatusCountFilters) =>
  hasSearch(filters) ? getProposalStatusCounts(filters) : getProposalStatusCountsCached(filters)
