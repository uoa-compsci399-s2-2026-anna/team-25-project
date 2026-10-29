import { PublicationCard, PublicationCardSkeleton } from "@repo/ui/components/composite"
import { Heading } from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import { BookOpen, ChevronDownIcon } from "lucide-react"
import { EmptyState } from "@/components/EmptyState"
import { StringHrefLink } from "@/components/StringHrefLink"
import { PublicationCardActionsServer } from "@/features/publications/components/PublicationCardActionsServer"
import { Routes } from "@/lib/routes"
import { type MembersRouteParams, parseMemberId } from "../../members.params"
import { getMemberPublicationsCached } from "../../members.queries"
import { MemberDetailSection } from "./MemberDetailSection"
import { mobileSection } from "./mobileSection"

// Stable keys for the placeholder cards, which have no data of their own.
const skeletonCardIds = ["publication-skeleton-0", "publication-skeleton-1"]

export const MemberPublications = async ({ params }: { params: MembersRouteParams }) => {
  const memberId = await parseMemberId(params)
  const publications = await getMemberPublicationsCached(memberId)

  return (
    <MemberDetailSection className={cn("max-md:order-4", mobileSection)} title="Publications">
      {publications.length > 0 ? (
        publications.map((publication) => (
          <PublicationCard
            action={<PublicationCardActionsServer publication={publication} />}
            key={publication.id}
            linkComponent={StringHrefLink}
            memberHref={Routes.MEMBERS.MEMBER}
            publication={publication}
          />
        ))
      ) : (
        <EmptyState icon={<BookOpen />} title="No publications yet" variant="section" />
      )}
    </MemberDetailSection>
  )
}

export const MemberPublicationsSkeleton = () => (
  <section className={cn("flex flex-col gap-4 max-md:order-4", mobileSection)}>
    <Heading className="flex items-center gap-2" level="h2">
      Publications
      <ChevronDownIcon aria-hidden="true" className="size-5 rotate-180" />
    </Heading>
    {skeletonCardIds.map((id) => (
      <PublicationCardSkeleton key={id} />
    ))}
  </section>
)
