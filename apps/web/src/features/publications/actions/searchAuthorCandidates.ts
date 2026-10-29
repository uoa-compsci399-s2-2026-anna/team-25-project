"use server"

import { z } from "zod"
import { matchCandidates } from "../authorCandidates.match"
import { getAllAuthorCandidates, getOtherAuthorCandidates } from "../authorCandidates.queries"
import type { AuthorSearchResult } from "../publications.types"

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

  return { ok: true, members: matchCandidates(parsed.data, candidates) }
}
