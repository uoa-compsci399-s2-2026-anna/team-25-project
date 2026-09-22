import { createParser } from "nuqs/server"

// parseAsInteger uses parseInt, which reads "2abc" as 2 and accepts 0 and negatives.
// Ids and page numbers start at 1, so anything else falls back to the default.
export const parseAsPositiveInteger = createParser({
  parse: (value) => (/^[1-9]\d*$/.test(value) ? Number(value) : null),
  serialize: String,
})
