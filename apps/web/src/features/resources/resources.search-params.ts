// `nuqs/server` carries no "use client" boundary, so these parsers work in server and client code.
import {
  createLoader,
  createSerializer,
  type inferParserType,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server"
import { parseAsPositiveInteger } from "@/lib/search-params"
import type { ResourceFilters } from "./resources.types"

export const resourceSorts = ["newest", "oldest", "titleAsc"] as const
export type ResourceSort = (typeof resourceSorts)[number]

export const resourceSearchParams = {
  q: parseAsString.withDefault(""),
  course: parseAsPositiveInteger,
  institution: parseAsPositiveInteger,
  sort: parseAsStringLiteral(resourceSorts).withDefault("newest"),
  page: parseAsPositiveInteger.withDefault(1),
}

export type ResourceSearchParams = inferParserType<typeof resourceSearchParams>

export const loadResourceSearchParams = createLoader(resourceSearchParams)

/** Builds a resources URL; values equal to their defaults, such as page 1, stay out of it. */
export const serializeResourceSearchParams = createSerializer(resourceSearchParams)

/** `page` is deliberately absent as it selects a slice of the results, it does not narrow them. */
export const toResourceFilters = ({
  course,
  institution,
  q,
  sort,
}: ResourceSearchParams): ResourceFilters => ({
  courseId: course ?? undefined,
  institutionId: institution ?? undefined,
  search: q.trim() || undefined,
  sort,
})
