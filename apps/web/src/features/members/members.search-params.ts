import { InstitutionCountry } from "@repo/shared/enums/institutions"
// `nuqs/server` carries no "use client" boundary, so these parsers work in server and client code.
import {
  createLoader,
  createSerializer,
  type inferParserType,
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server"
import { parseAsPositiveInteger } from "@/lib/search-params"
import type { MemberFilters } from "./members.queries"

/** Enough to cast a wide net without the chips swamping the row or the URL. */
export const MEMBER_INTEREST_FILTER_MAX = 6

export const memberSorts = ["surnameAsc", "surnameDesc"] as const
export type MemberSort = (typeof memberSorts)[number]

export const memberSearchParams = {
  q: parseAsString.withDefault(""),
  institution: parseAsPositiveInteger,
  country: parseAsStringLiteral(Object.values(InstitutionCountry)),
  interest: parseAsArrayOf(parseAsString).withDefault([]),
  sort: parseAsStringLiteral(memberSorts).withDefault("surnameAsc"),
  page: parseAsPositiveInteger.withDefault(1),
}

export type MemberSearchParams = inferParserType<typeof memberSearchParams>

export const loadMemberSearchParams = createLoader(memberSearchParams)

/** Builds a members URL; values equal to their defaults stay out of it. */
export const serializeMemberSearchParams = createSerializer(memberSearchParams)

/** `page` is deliberately absent: it selects a slice of the results, it does not narrow them. */
export const toMemberFilters = ({
  country,
  institution,
  interest,
  q,
  sort,
}: MemberSearchParams): MemberFilters => ({
  country: country ?? undefined,
  institutionId: institution ?? undefined,
  // Blanks are dropped, but a kept value reaches the query exactly as stored, or an interest
  // saved with surrounding spaces would never match its own filter option.
  // Capped here as well as in the bar, so a hand-edited URL cannot widen the query.
  researchInterests: interest.filter((value) => value.trim()).slice(0, MEMBER_INTEREST_FILTER_MAX),
  search: q.trim() || undefined,
  sort,
})
