import type { Publication } from "@repo/shared/payload-types"
import { getAuthorCandidatesCached } from "@/features/publications/authorCandidates.queries"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import type { FormValues } from "./AddPublicationForm"
import { PublicationCardActions } from "./PublicationCardActions"

const authorMemberId = (author: Publication["authors"][number]) =>
  typeof author.member === "object" ? author.member?.id : (author.member ?? undefined)

/**
 * Resolves the full `AuthorCandidate` for each linked author, so the edit
 * form's rows can show their avatar, position and institution - the
 * publication's own `authors.member` is populated with the avatar only (see
 * `getPublications`), not enough to draw a `LinkedAuthor` row.
 */
const initialAuthors = async (publication: Publication): Promise<FormValues["authors"]> => {
  const candidates = await getAuthorCandidatesCached()
  const candidateById = new Map(candidates.map((candidate) => [candidate.id, candidate]))

  return publication.authors.map((author, index) => {
    const id = author.id ?? `author-${index}`
    const memberId = authorMemberId(author)
    const candidate = memberId !== undefined ? candidateById.get(memberId) : undefined

    return candidate
      ? {
          id,
          kind: "member" as const,
          member: candidate,
          matched: false,
          memberId: candidate.id,
          name: author.name,
        }
      : { id, kind: "external" as const, name: author.name }
  })
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
