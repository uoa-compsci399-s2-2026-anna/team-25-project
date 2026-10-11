import { createParser } from "nuqs/server"

// parseAsInteger uses parseInt, which reads "2abc" as 2 and accepts 0 and negatives.
// Ids and page numbers start at 1, so anything else falls back to the default.
// Nine digits at most keeps the value inside a Postgres integer; a longer one fails the query.
export const parseAsPositiveInteger = createParser({
  parse: (value) => (/^[1-9]\d{0,8}$/.test(value) ? Number(value) : null),
  serialize: String,
})
