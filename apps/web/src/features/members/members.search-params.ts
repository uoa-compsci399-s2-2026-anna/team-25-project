import { InstitutionCountry } from "@repo/shared/enums/institutions"
// `nuqs/server` carries no "use client" boundary, so these parsers work in server and client code.
import {
  createLoader,
  createSerializer,
  type inferParserType,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server"
import { parseAsPositiveInteger } from "@/lib/search-params"
import type { MemberFilters } from "./members.queries"

export const memberSorts = ["surnameAsc", "surnameDesc"] as const
export type MemberSort = (typeof memberSorts)[number]

export const memberSearchParams = {
  q: parseAsString.withDefault(""),
  institution: parseAsPositiveInteger,
  country: parseAsStringLiteral(Object.values(InstitutionCountry)),
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
  q,
  sort,
}: MemberSearchParams): MemberFilters => ({
  country: country ?? undefined,
  institutionId: institution ?? undefined,
  search: q.trim() || undefined,
  sort,
})
