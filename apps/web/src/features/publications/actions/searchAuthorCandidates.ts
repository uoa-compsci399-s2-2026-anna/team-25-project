"use server"

import { normaliseName, parsePrintedName, suggestMembers } from "@repo/shared/utils/author-match"
import { z } from "zod"
import { getAllAuthorCandidates, getOtherAuthorCandidates } from "../authorCandidates.queries"
import type { AuthorSearchResult } from "../publications.types"

const RESULT_LIMIT = 8

const querySchema = z.string().trim().min(1).max(200)

const optionsSchema = z.object({ includeSelf: z.boolean() }).partial()

/**
 * Members whose name fits the typed text, for the author picker. Adding leaves out
 * the signed-in member, who already has their own row. `includeSelf` is for
 * editing, which has no such row - see getAllAuthorCandidates.
 */
export const searchAuthorCandidates = async (
  query: unknown,
  options?: unknown,
): Promise<AuthorSearchResult> => {
  const includeSelf = optionsSchema.safeParse(options ?? {}).data?.includeSelf === true
  const candidates = includeSelf ? await getAllAuthorCandidates() : await getOtherAuthorCandidates()
  if (!candidates) return { ok: false }

  const parsed = querySchema.safeParse(query)
  if (!parsed.success) return { ok: true, members: [] }

  // Name matches ("J. Smith") come first, then members whose name contains the
  // text, so a partly typed name still finds them.
  const text = normaliseName(parsed.data)
  const byName = suggestMembers(parsePrintedName(parsed.data), candidates)
  const byText = candidates.filter((member) =>
    normaliseName(`${member.firstName} ${member.lastName}`).includes(text),
  )
  return { ok: true, members: [...new Set([...byName, ...byText])].slice(0, RESULT_LIMIT) }
}
