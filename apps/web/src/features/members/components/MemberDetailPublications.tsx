import { PublicationTypeLabels } from "@repo/shared/enums/publications"
import { Badge, Card, CardContent, CardHeader, Heading, Skeleton } from "@repo/ui/components/ui"
import { type MembersRouteParams, parseMemberId } from "../members.params"
import { getMemberPublicationsCached } from "../members.queries"

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
          <Card key={publication.id}>
            <CardHeader className="flex items-center justify-between gap-3">
              <Badge className="uppercase tracking-wide" variant="blue">
                {PublicationTypeLabels[publication.type]}
              </Badge>
              <span className="text-muted-foreground text-xs">Published {publication.year}</span>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <p className="font-semibold">{publication.title}</p>
              {publication.authors.length > 0 && (
                <p className="text-muted-foreground text-sm">
                  {publication.authors.map((author) => author.name).join(", ")}
                </p>
              )}
            </CardContent>
          </Card>
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
      <Card key={id}>
        <CardHeader className="flex items-center justify-between gap-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-20" />
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    ))}
  </section>
)
