import { PublicationType } from "@repo/shared/enums/publications"
import {
  createLoader,
  createParser,
  createSerializer,
  type inferParserType,
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server"
import { parseAsPositiveInteger } from "@/lib/search-params"
import type { PublicationFilters } from "./publications.types"

/** Enough to cast a wide net without the chips swamping the row or the URL. */
export const PUBLICATION_TAG_FILTER_MAX = 6

export const publicationSorts = ["newest", "oldest", "titleAsc"] as const
export type PublicationSort = (typeof publicationSorts)[number]

// The collection stores four-digit years only. Year views are cached, so any other
// value would add a cache entry for a result that is always empty.
const parseAsPublicationYear = createParser({
  parse: (value) => (/^[1-9]\d{3}$/.test(value) ? Number(value) : null),
  serialize: String,
})

export const publicationSearchParams = {
  q: parseAsString.withDefault(""),
  type: parseAsStringLiteral(Object.values(PublicationType)),
  year: parseAsPublicationYear,
  tags: parseAsArrayOf(parseAsString).withDefault([]),
  sort: parseAsStringLiteral(publicationSorts).withDefault("newest"),
  page: parseAsPositiveInteger.withDefault(1),
}

export type PublicationSearchParams = inferParserType<typeof publicationSearchParams>

export const loadPublicationSearchParams = createLoader(publicationSearchParams)

/** Builds a publications URL; values equal to their defaults, such as page 1, stay out of it. */
export const serializePublicationSearchParams = createSerializer(publicationSearchParams)

/** `page` is deliberately absent as it selects a slice of the results, it does not narrow them. */
export const toPublicationFilters = ({
  q,
  sort,
  tags,
  type,
  year,
}: PublicationSearchParams): PublicationFilters => {
  // `?tags=,` parses to empty strings, which no publication has.
  // Capped here as well as in the bar, so a hand-edited URL cannot widen the query.
  const namedTags = tags.filter((tag) => tag.trim() !== "").slice(0, PUBLICATION_TAG_FILTER_MAX)

  return {
    search: q.trim() || undefined,
    sort,
    tags: namedTags.length > 0 ? namedTags : undefined,
    type: type ?? undefined,
    year: year ?? undefined,
  }
}
