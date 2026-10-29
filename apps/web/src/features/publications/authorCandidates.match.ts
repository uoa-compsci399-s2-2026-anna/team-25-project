import { normaliseName, parsePrintedName, suggestMembers } from "@repo/shared/utils/author-match"
import type { AuthorCandidate } from "./publications.types"

const RESULT_LIMIT = 8

/**
 * Members whose name fits the typed text. Name matches ("J. Smith") come first, then
 * members whose name contains the text, so a partly typed name still finds them.
 */
export const matchCandidates = (query: string, members: AuthorCandidate[]) => {
  const text = normaliseName(query)
  const byName = suggestMembers(parsePrintedName(query), members)
  const byText = members.filter((member) =>
    normaliseName(`${member.firstName} ${member.lastName}`).includes(text),
  )
  return [...new Set([...byName, ...byText])].slice(0, RESULT_LIMIT)
}
