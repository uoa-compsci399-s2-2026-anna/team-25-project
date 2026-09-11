import { ProposalTagLabels } from "@repo/shared/enums/proposals"
import { ProposalCard } from "@repo/ui/components/composite"
import Link from "next/link"
import { Routes } from "@/lib/routes"
import { getProposals } from "../proposals.queries"

export const ProposalsList = async () => {
  const proposals = await getProposals({}, { page: 1, limit: 10 })
  return (
    <div className="grid w-full gap-8 p-10 md:p-12 lg:grid-cols-2 lg:gap-10">
      {proposals.docs.map((proposal) => {
        const author = proposal.author.find((author) => typeof author !== "number")
        const institution =
          author && typeof author.institution !== "number" ? author.institution : undefined
        const avatar =
          author?.avatar && typeof author.avatar !== "number" ? author.avatar : undefined

        return (
          <ProposalCard
            author={{
              avatarSrc: avatar?.url ?? undefined,
              institution: institution?.name,
              name: author ? `${author.firstName} ${author.lastName}` : "Unknown author",
            }}
            // The page resolves on the leading id; the slug is only for readability.
            href={Routes.PROPOSALS.PROPOSAL(
              proposal.proposalSlug
                ? `${proposal.id}-${proposal.proposalSlug}`
                : String(proposal.id),
            )}
            key={proposal.id}
            linkComponent={Link}
            postedAt={proposal.createdAt}
            status={proposal.status}
            summary={proposal.summary}
            tags={proposal.tags?.map((tag) => ({ label: ProposalTagLabels[tag] }))}
            title={proposal.title}
          />
        )
      })}
    </div>
  )
}
