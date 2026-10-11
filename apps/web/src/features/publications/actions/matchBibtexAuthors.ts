"use server"

import { suggestMembers } from "@repo/shared/utils/author-match"
import { z } from "zod"
import { getOtherAuthorCandidates } from "../authorCandidates.queries"
import type { AuthorMatchResult } from "../publications.types"

const MAX_AUTHORS = 500

const namesSchema = z.array(z.unknown()).max(MAX_AUTHORS)
const nameSchema = z.object({
  given: z.array(z.string().max(100)).max(10),
  family: z.string().max(200),
})

/**
 * Matches each imported author name to the members. A name links only when exactly
 * one member fits it. A name that is not valid gets no match, and the others still
 * match. The signed-in member is matched in the browser, as the self row.
 */
export const matchBibtexAuthors = async (names: unknown): Promise<AuthorMatchResult> => {
  const parsed = namesSchema.safeParse(names)
  if (!parsed.success) return { ok: false }

  const others = await getOtherAuthorCandidates()
  if (!others) return { ok: false }

  const matches = parsed.data.map((value) => {
    const name = nameSchema.safeParse(value)
    if (!name.success) return null
    const [only, ...rest] = suggestMembers(name.data, others)
    return only && rest.length === 0 ? only : null
  })
  return { ok: true, matches }
}
