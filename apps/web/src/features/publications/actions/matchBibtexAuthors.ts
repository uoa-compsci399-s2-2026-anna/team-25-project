"use server"

import { suggestMembers } from "@repo/shared/utils/author-match"
import { z } from "zod"
import { getOtherAuthorCandidates } from "../authorCandidates.queries"
import type { AuthorCandidate } from "../publications.types"

const MAX_AUTHORS = 500

const namesSchema = z
  .array(z.object({ given: z.array(z.string().max(100)).max(10), family: z.string().max(200) }))
  .max(MAX_AUTHORS)

/**
 * Matches each imported author name to the members. A name links only when exactly
 * one member fits it. The signed-in member is matched in the browser, as the self row.
 */
export const matchBibtexAuthors = async (
  names: unknown,
): Promise<(AuthorCandidate | null)[] | null> => {
  const parsed = namesSchema.safeParse(names)
  if (!parsed.success) return null

  const others = await getOtherAuthorCandidates()
  if (!others) return null

  return parsed.data.map((name) => {
    const [only, ...rest] = suggestMembers(name, others)
    return only && rest.length === 0 ? only : null
  })
}
