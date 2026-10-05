"use server"

import { normaliseName, parsePrintedName, suggestMembers } from "@repo/shared/utils/author-match"
import { z } from "zod"
import { getOtherAuthorCandidates } from "../authorCandidates.queries"
import type { AuthorCandidate } from "../publications.types"

const RESULT_LIMIT = 8

const querySchema = z.string().trim().min(1).max(200)

/**
 * Members whose name fits the typed text, for the author picker. Leaves out the
 * signed-in member, who already has their own row.
 */
export const searchAuthorCandidates = async (query: unknown): Promise<AuthorCandidate[]> => {
  const parsed = querySchema.safeParse(query)
  if (!parsed.success) return []

  const others = await getOtherAuthorCandidates()
  if (!others) return []

  // Name matches ("J. Smith") come first, then members whose name contains the
  // text, so a partly typed name still finds them.
  const text = normaliseName(parsed.data)
  const byName = suggestMembers(parsePrintedName(parsed.data), others)
  const byText = others.filter((member) =>
    normaliseName(`${member.firstName} ${member.lastName}`).includes(text),
  )
  return [...new Set([...byName, ...byText])].slice(0, RESULT_LIMIT)
}
