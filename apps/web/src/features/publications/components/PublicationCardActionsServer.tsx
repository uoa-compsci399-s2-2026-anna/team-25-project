import type { Publication } from "@repo/shared/payload-types"
import { getAuthorCandidatesCached } from "@/features/publications/authorCandidates.queries"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import type { AuthorCandidate } from "../publications.types"
import type { FormValues } from "./AddPublicationForm"
import { PublicationCardActions } from "./PublicationCardActions"

type PublicationAuthor = Publication["authors"][number]

const authorMemberId = (author: PublicationAuthor) =>
  typeof author.member === "object" ? author.member?.id : (author.member ?? undefined)

/**
 * A stand-in for a linked member the candidates cache doesn't have yet. The
 * publication only populates their avatar, so the name comes from the printed
 * one - enough to keep the link, rather than turn them into an external author
 * and quietly unlink them on the next save.
 */
const fallbackCandidate = (author: PublicationAuthor, memberId: number): AuthorCandidate => {
  const name = author.name.trim()
  const lastSpace = name.lastIndexOf(" ")
  const avatar = typeof author.member === "object" ? author.member?.avatar : undefined
  return {
    avatarUrl: typeof avatar === "object" ? (avatar?.url ?? undefined) : undefined,
    firstName: lastSpace === -1 ? name : name.slice(0, lastSpace),
    id: memberId,
    lastName: lastSpace === -1 ? "" : name.slice(lastSpace + 1),
    position: "",
  }
}

/**
 * Resolves the full `AuthorCandidate` for each linked author, so the edit
 * form's rows can show their avatar, position and institution - the
 * publication's own `authors.member` is populated with the avatar only (see
 * `getPublications`), not enough to draw a `LinkedAuthor` row.
 */
const initialAuthors = async (publication: Publication): Promise<FormValues["authors"]> => {
  const candidates = await getAuthorCandidatesCached()
  const candidateById = new Map(candidates.map((candidate) => [candidate.id, candidate]))
  const missingMemberIds: number[] = []

  const authors = publication.authors.map((author, index) => {
    const id = author.id ?? `author-${index}`
    const memberId = authorMemberId(author)
    if (memberId === undefined) return { id, kind: "external" as const, name: author.name }

    let candidate = candidateById.get(memberId)
    if (!candidate) {
      missingMemberIds.push(memberId)
      candidate = fallbackCandidate(author, memberId)
    }
    return {
      id,
      kind: "member" as const,
      matched: false,
      member: candidate,
      memberId,
      name: author.name,
    }
  })

  // cacheLife("max") can serve the old member list once after a member is added.
  if (missingMemberIds.length > 0) {
    const payload = await getPayloadClient()
    payload.logger.warn(
      { memberIds: missingMemberIds, publicationId: publication.id },
      "Author candidates cache is missing linked members; kept their links",
    )
  }

  return authors
}

const initialValues = async (publication: Publication): Promise<FormValues> => ({
  abstract: publication.abstract ?? "",
  authors: await initialAuthors(publication),
  citationKey: publication.citationKey ?? "",
  doi: publication.doi ?? "",
  issue: publication.issue ?? "",
  month: publication.month ? String(publication.month) : "",
  pages: publication.pages ?? "",
  publisher: publication.publisher ?? "",
  tags: publication.tags?.join(", ") ?? "",
  title: publication.title,
  type: publication.type,
  url: publication.url ?? "",
  venue: publication.venue ?? "",
  volume: publication.volume ?? "",
  year: publication.year,
})

// getCurrentUser() reads headers(), which is dynamic - the list that renders this
// is already inside a Suspense boundary (its own searchParams make it dynamic
// too), so there is nothing extra to isolate here.
export const PublicationCardActionsServer = async ({
  publication,
}: {
  publication: Publication
}) => {
  const { collection, user } = await getCurrentUser()
  const authorIds = publication.authors.map(authorMemberId)
  const canManage =
    collection === Slugs.Collections.ADMIN || (user !== null && authorIds.includes(user.id))

  if (!canManage) {
    return null
  }

  return (
    <PublicationCardActions
      initialValues={await initialValues(publication)}
      publicationId={publication.id}
      title={publication.title}
    />
  )
}
