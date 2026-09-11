import { QueryKeys } from "@repo/shared/constants/query-keys"
import type { ProposalStatus, ProposalTag } from "@repo/shared/enums/proposals"
import type { Institution } from "@repo/shared/payload-types"
import type { Pagination } from "@repo/shared/types/pagination"
import { cacheLife, cacheTag } from "next/cache"
import type { Where } from "payload"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"

export type ProposalFilters = {
  institutionId?: Institution["id"]
  tag?: ProposalTag
  search?: string
  sort?: "newest" | "oldest"
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

export const getProposalsCached = async (filters: ProposalFilters, pagination: Pagination) => {
  "use cache"
  cacheLife("max")
  cacheTag(QueryKeys.PROPOSALS)
  return getProposals(filters, pagination)
}
