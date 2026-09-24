import { ProposalStatusLabels } from "@repo/shared/enums/proposals"
import { Badge, Card, CardContent, CardHeader, Heading, Skeleton } from "@repo/ui/components/ui"
import Link from "next/link"
import { formatDate } from "@/features/courses/courses.format"
import { Routes } from "@/lib/routes"
import { getMemberProposalsCached } from "../member.queries"
import { type MembersRouteParams, parseMemberId } from "../members.params"

export const MemberProposals = async ({ params }: { params: MembersRouteParams }) => {
  const memberId = await parseMemberId(params)
  const proposals = await getMemberProposalsCached(memberId)

  return (
    <section className="flex flex-col gap-4">
      <Heading level="h2">Proposals</Heading>
      {proposals.length === 0 ? (
        <p className="text-muted-foreground text-sm">No proposals yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {proposals.map((proposal) => {
            // Proposals have no postedAt field; createdAt is the posted date, as in ProposalsList.
            const postedAt = formatDate(proposal.createdAt)

            return (
              <Link
                className="group"
                href={Routes.PROPOSALS.PROPOSAL(proposal.id, proposal.proposalSlug)}
                key={proposal.id}
              >
                <Card className="transition-colors group-hover:ring-foreground/25">
                  <CardHeader className="flex items-center justify-between gap-3">
                    <Badge
                      className="uppercase tracking-wide"
                      variant={proposal.status === "closed" ? "closed" : "active"}
                    >
                      {ProposalStatusLabels[proposal.status]}
                    </Badge>
                    {postedAt && (
                      <span className="text-muted-foreground text-xs">Posted {postedAt}</span>
                    )}
                  </CardHeader>
                  <CardContent className="font-medium group-hover:underline">
                    {proposal.title}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}

export const MemberProposalsSkeleton = () => (
  <div className="flex flex-col gap-4">
    <Skeleton className="h-7 w-40" />
    <Skeleton className="h-16 w-full" />
    <Skeleton className="h-16 w-full" />
  </div>
)
