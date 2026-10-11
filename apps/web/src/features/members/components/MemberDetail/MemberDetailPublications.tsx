import { PublicationCard, PublicationCardSkeleton } from "@repo/ui/components/composite"
import { Heading } from "@repo/ui/components/ui"
import { StringHrefLink } from "@/components/StringHrefLink"
import { Routes } from "@/lib/routes"
import { type MembersRouteParams, parseMemberId } from "../../members.params"
import { getMemberPublicationsCached } from "../../members.queries"

// Stable keys for the placeholder cards, which have no data of their own.
const skeletonCardIds = ["publication-skeleton-0", "publication-skeleton-1"]

export const MemberPublications = async ({ params }: { params: MembersRouteParams }) => {
  const memberId = await parseMemberId(params)
  const publications = await getMemberPublicationsCached(memberId)

  return (
    <section className="flex flex-col gap-4">
      <Heading level="h2">Publications</Heading>
      {publications.length > 0 ? (
        publications.map((publication) => (
          <PublicationCard
            key={publication.id}
            linkComponent={StringHrefLink}
            memberHref={Routes.MEMBERS.MEMBER}
            publication={publication}
          />
        ))
      ) : (
        <p className="text-muted-foreground text-sm">No publications yet.</p>
      )}
    </section>
  )
}

export const MemberPublicationsSkeleton = () => (
  <section className="flex flex-col gap-4">
    <Heading level="h2">Publications</Heading>
    {skeletonCardIds.map((id) => (
      <PublicationCardSkeleton key={id} />
    ))}
  </section>
)
