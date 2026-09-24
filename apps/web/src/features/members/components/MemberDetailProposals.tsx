import { ProposalStatus, ProposalStatusLabels } from "@repo/shared/enums/proposals"
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  Heading,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui"
import Link from "next/link"
import { formatDate } from "@/features/courses/courses.format"
import { Routes } from "@/lib/routes"
import { getMemberProposalsCached } from "../member.queries"
import { type MembersRouteParams, parseMemberId } from "../members.params"

type MemberProposal = Awaited<ReturnType<typeof getMemberProposalsCached>>[number]

export const MemberProposals = async ({ params }: { params: MembersRouteParams }) => {
  const memberId = await parseMemberId(params)
  const proposals = await getMemberProposalsCached(memberId)
  const active = proposals.filter((proposal) => proposal.status === ProposalStatus.ACTIVE)
  const closed = proposals.filter((proposal) => proposal.status === ProposalStatus.CLOSED)

  return (
    <Tabs className="gap-4" defaultValue={ProposalStatus.ACTIVE} render={<section />}>
      <div className="flex flex-row justify-between">
        <Heading level="h1">Proposals</Heading>
        <TabsList className="w-80" variant="pill">
          <TabsTrigger value={ProposalStatus.ACTIVE}>
            {`${ProposalStatusLabels.active} - ${active.length}`}
          </TabsTrigger>
          <TabsTrigger value={ProposalStatus.CLOSED}>
            {`${ProposalStatusLabels.closed} - ${closed.length}`}
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value={ProposalStatus.ACTIVE}>
        <ProposalList emptyText="No active proposals." proposals={active} />
      </TabsContent>
      <TabsContent value={ProposalStatus.CLOSED}>
        <ProposalList emptyText="No closed proposals." proposals={closed} />
      </TabsContent>
    </Tabs>
  )
}

const ProposalList = ({
  proposals,
  emptyText,
}: {
  proposals: MemberProposal[]
  emptyText: string
}) => {
  if (proposals.length === 0) return <p className="text-muted-foreground text-sm">{emptyText}</p>

  return (
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
  )
}

export const MemberProposalsSkeleton = () => (
  <div className="flex flex-col gap-4">
    <Skeleton className="h-7 w-40" />
    <Skeleton className="h-16 w-full" />
    <Skeleton className="h-16 w-full" />
  </div>
)
