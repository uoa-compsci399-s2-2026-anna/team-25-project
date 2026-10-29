"use server"

import type { MemberOption } from "@repo/ui/components/composite"
import { z } from "zod"
import { matchCandidates } from "@/features/publications/authorCandidates.match"
import { getAuthorCandidates } from "@/features/publications/authorCandidates.queries"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"

const querySchema = z.string().trim().min(1).max(200)
const excludeSchema = z.array(z.number().int().positive()).max(100)

/**
 * Members whose name fits the typed text, for the course editor and teaching team
 * pickers. Unlike the author search it keeps the signed-in member, who may add
 * themselves to a teaching team. Members already chosen are left out before the
 * result limit, so they cannot take every slot. Reads fresh, so a member who just
 * signed up can be found.
 */
export const searchMembers = async (
  query: unknown,
  exclude: unknown = [],
): Promise<MemberOption[] | { error: string }> => {
  const { collection, user } = await getCurrentUser()
  if (!user) return { error: "Sign in again to search members." }
  if (collection !== Slugs.Collections.MEMBERS) return { error: "Only members can search members." }

  const parsed = querySchema.safeParse(query)
  const excluded = excludeSchema.safeParse(exclude)
  if (!parsed.success || !excluded.success) return []

  const members = await getAuthorCandidates()
  return matchCandidates(
    parsed.data,
    members.filter((member) => !excluded.data.includes(member.id)),
  )
}
