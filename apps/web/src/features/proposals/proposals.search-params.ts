import { ProposalStatus, ProposalTag } from "@repo/shared/enums/proposals"
// `nuqs/server` carries no "use client" boundary, so these parsers work in server and client code.
import {
  createLoader,
  createParser,
  type inferParserType,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server"
import type { ProposalFilters } from "./proposals.queries"

// parseAsInteger uses parseInt, which reads "2abc" as 2 and accepts 0 and negatives.
// Ids and page numbers start at 1, so anything else falls back to the default.
const parseAsPositiveInteger = createParser({
  parse: (value) => (/^[1-9]\d*$/.test(value) ? Number(value) : null),
  serialize: String,
})

export const PROPOSAL_STATUS_ALL = "all"
export const proposalStatusFilters = [
  ...Object.values(ProposalStatus),
  PROPOSAL_STATUS_ALL,
] as const
export const proposalSorts = ["newest", "oldest"] as const
export type ProposalSort = (typeof proposalSorts)[number]

export const proposalSearchParams = {
  status: parseAsStringLiteral(proposalStatusFilters).withDefault(ProposalStatus.ACTIVE),
  q: parseAsString.withDefault(""),
  institution: parseAsPositiveInteger,
  tag: parseAsStringLiteral(Object.values(ProposalTag)),
  sort: parseAsStringLiteral(proposalSorts).withDefault("newest"),
  page: parseAsPositiveInteger.withDefault(1),
}

export type ProposalSearchParams = inferParserType<typeof proposalSearchParams>

export const loadProposalSearchParams = createLoader(proposalSearchParams)

export const toProposalFilters = ({
  institution,
  q,
  sort,
  status,
  tag,
}: ProposalSearchParams): ProposalFilters => ({
  institutionId: institution ?? undefined,
  search: q.trim() || undefined,
  sort,
  status: status === PROPOSAL_STATUS_ALL ? undefined : status,
  tag: tag ?? undefined,
})
