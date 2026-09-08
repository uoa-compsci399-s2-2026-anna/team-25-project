/**
 * Payload keys its table map with `to-snake-case`, so this mirrors that
 * package's rules exactly rather than a general-purpose snake case. The two
 * disagree on runs of capitals — `to-snake-case` splits every capital in a run
 * into its own word ("APIKey" is "a_p_i_key", not "api_key") — and a lookup
 * built on the nicer-looking spelling simply misses the table.
 *
 * Keep `snake-case.test.ts` in step with Payload's dependency if it ever
 * changes the package it uses.
 */

const HAS_SPACE = /\s/
const HAS_SEPARATOR = /[-.:_]/
const HAS_CAMEL = /([a-z][A-Z]|[A-Z][a-z])/
const SEPARATORS = /[\W_]+(.|$)/g
const CAMEL_BOUNDARY = /(.)([A-Z]+)/g

/** Collapses runs of separators into single spaces, dropping a trailing run. */
const unseparate = (value: string): string =>
  value.replace(SEPARATORS, (_match, next: string) => (next ? ` ${next}` : ""))

/** Splits on camel boundaries, giving each capital in a run its own word. */
const uncamelize = (value: string): string =>
  value.replace(
    CAMEL_BOUNDARY,
    (_match, previous: string, uppers: string) =>
      `${previous} ${uppers.toLowerCase().split("").join(" ")}`,
  )

/** Strips whichever casing `value` already carries, leaving lowercase words. */
const noCase = (value: string): string => {
  if (HAS_SPACE.test(value)) return value.toLowerCase()
  if (HAS_SEPARATOR.test(value)) return (unseparate(value) || value).toLowerCase()
  if (HAS_CAMEL.test(value)) return uncamelize(value).toLowerCase()
  return value.toLowerCase()
}

/**
 * Converts `value` to the snake case Payload uses for table and column names.
 *
 * @param value - A collection slug or field name.
 * @returns The name in snake case.
 */
export function snakeCase(value: string): string {
  return unseparate(noCase(value)).trim().replace(/\s/g, "_")
}
