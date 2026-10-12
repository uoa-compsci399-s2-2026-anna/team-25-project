import { ProposalStatus, ProposalStatusLabels } from "@repo/shared/enums/proposals"
import {
  Badge,
  Button,
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
import { cn } from "@repo/ui/lib/utils"
import { Lightbulb } from "lucide-react"
import Link from "next/link"
import { withEditHash } from "@/components/Editor/editOnLoad"
import { EmptyState } from "@/components/EmptyState"
import { formatDate } from "@/features/courses/courses.format"
import { Routes } from "@/lib/routes"
import { isOwnProfile } from "../../members.ownership"
import { type MembersRouteParams, parseMemberId } from "../../members.params"
import { getMemberProposalsCached } from "../../members.queries"
import { mobileSection } from "./mobileSection"

type MemberProposal = Awaited<ReturnType<typeof getMemberProposalsCached>>[number]

export const MemberProposals = async ({ params }: { params: MembersRouteParams }) => {
  const memberId = await parseMemberId(params)
  const [proposals, canEdit] = await Promise.all([
    getMemberProposalsCached(memberId),
    isOwnProfile(memberId),
  ])
  const active = proposals.filter((proposal) => proposal.status === ProposalStatus.ACTIVE)
  const closed = proposals.filter((proposal) => proposal.status === ProposalStatus.CLOSED)

  return (
    <Tabs
      className={cn("gap-4 max-md:order-4", mobileSection)}
      defaultValue={ProposalStatus.ACTIVE}
      render={<section />}
    >
      <div className="flex flex-row items-center justify-between gap-3">
        <Heading level="h2">Proposals</Heading>
        <TabsList className="w-80 max-md:w-auto max-md:text-xs" variant="pill">
          <TabsTrigger value={ProposalStatus.ACTIVE}>
            {`${ProposalStatusLabels.active} - ${active.length}`}
          </TabsTrigger>
          <TabsTrigger value={ProposalStatus.CLOSED}>
            {`${ProposalStatusLabels.closed} - ${closed.length}`}
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value={ProposalStatus.ACTIVE}>
        <ProposalList canEdit={canEdit} emptyTitle="No active proposals" proposals={active} />
      </TabsContent>
      <TabsContent value={ProposalStatus.CLOSED}>
        <ProposalList canEdit={canEdit} emptyTitle="No closed proposals" proposals={closed} />
      </TabsContent>
    </Tabs>
  )
}

const ProposalList = ({
  canEdit,
  proposals,
  emptyTitle,
}: {
  /** On the member's own profile: an Edit link per proposal that opens its editor. */
  canEdit: boolean
  proposals: MemberProposal[]
  emptyTitle: string
}) => {
  if (proposals.length === 0) {
    return <EmptyState className="border p-6" icon={<Lightbulb />} title={emptyTitle} />
  }

  return (
    <div className="flex flex-col gap-3">
      {proposals.map((proposal) => {
        // Proposals have no postedAt field; createdAt is the posted date, as in ProposalsList.
        const postedAt = formatDate(proposal.createdAt)
        const href = Routes.PROPOSALS.PROPOSAL(proposal.id, proposal.proposalSlug)

        return (
          // The Edit link sits beside the card's link, not inside it - links can't nest.
          <div className="relative" key={proposal.id}>
            <Link className="group" href={href}>
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
                <CardContent
                  className={cn("font-medium group-hover:underline", canEdit && "pr-20")}
                >
                  {proposal.title}
                </CardContent>
              </Card>
            </Link>
            {canEdit && (
              <Button
                aria-label={`Edit ${proposal.title}`}
                borderColor="charcoal"
                className="absolute right-4 bottom-4"
                nativeButton={false}
                render={<Link href={withEditHash(href)} />}
                size="sm"
                variant="button-transparent"
              >
                Edit
              </Button>
            )}
          </div>
        )
      })}
    </div>
  )
}

export const MemberProposalsSkeleton = () => (
  <div className={cn("flex flex-col gap-4 max-md:order-4", mobileSection)}>
    <Skeleton className="h-7 w-40" />
    <Skeleton className="h-16 w-full" />
    <Skeleton className="h-16 w-full" />
  </div>
)
