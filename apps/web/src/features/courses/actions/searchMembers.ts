"use server"

import type { MemberOption } from "@repo/ui/components/composite"
import { z } from "zod"
import { matchCandidates } from "@/features/publications/authorCandidates.match"
import { getAuthorCandidatesCached } from "@/features/publications/authorCandidates.queries"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"

const querySchema = z.string().trim().min(1).max(200)

/**
 * Members whose name fits the typed text, for the course editor and teaching team
 * pickers. Unlike the author search it keeps the signed-in member, who may add
 * themselves to a teaching team.
 */
export const searchMembers = async (
  query: unknown,
): Promise<MemberOption[] | { error: string }> => {
  const { collection, user } = await getCurrentUser()
  if (!user) return { error: "Sign in again to search members." }
  if (collection !== Slugs.Collections.MEMBERS) return { error: "Only members can search members." }

  const parsed = querySchema.safeParse(query)
  if (!parsed.success) return []

  return matchCandidates(parsed.data, await getAuthorCandidatesCached())
}
