import { QueryKeys } from "@repo/shared/constants/query-keys"
import { cacheLife, cacheTag } from "next/cache"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import type { AuthorCandidate } from "./publications.types"

// The member list is small, and names are matched in code (accents, initials), so
// load every member once rather than search the database for each name.
export const getAuthorCandidates = async (): Promise<AuthorCandidate[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: Slugs.Collections.MEMBERS,
    depth: 1,
    pagination: false,
    // The Local API overrides access, so ask only for what the picker shows.
    select: { firstName: true, lastName: true, position: true, institution: true, avatar: true },
    populate: {
      [Slugs.Collections.INSTITUTIONS]: { name: true },
      [Slugs.Collections.MEDIA]: { url: true },
    },
  })
  return docs.map((member) => ({
    id: member.id,
    firstName: member.firstName,
    lastName: member.lastName,
    position: member.position,
    institution: typeof member.institution === "object" ? member.institution?.name : undefined,
    avatarUrl: typeof member.avatar === "object" ? (member.avatar?.url ?? undefined) : undefined,
  }))
}

export const getAuthorCandidatesCached = async () => {
  "use cache"
  cacheLife("max")
  cacheTag(QueryKeys.MEMBERS.ROOT)
  return getAuthorCandidates()
}

/** Every member except the signed-in one, who has their own row. Null for a non-member. */
export const getOtherAuthorCandidates = async () => {
  const { collection, user } = await getCurrentUser()
  if (collection !== Slugs.Collections.MEMBERS) return null
  return (await getAuthorCandidatesCached()).filter((member) => member.id !== user.id)
}
