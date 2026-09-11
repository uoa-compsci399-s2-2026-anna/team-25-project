import { ProposalTagLabels } from "@repo/shared/enums/proposals"
import { ProposalCard } from "@repo/ui/components/composite"
import Link from "next/link"
import type { SearchParams } from "nuqs/server"
import { Routes } from "@/lib/routes"
import { loadProposalsPage } from "../proposals.queries"
import { loadProposalSearchParams, toProposalFilters } from "../proposals.search-params"

const PAGE_SIZE = 10

export const ProposalsList = async ({ searchParams }: { searchParams: Promise<SearchParams> }) => {
  const params = await loadProposalSearchParams(searchParams)
  const { docs: proposals, totalDocs } = await loadProposalsPage(toProposalFilters(params), {
    limit: PAGE_SIZE,
    page: params.page,
  })

  if (proposals.length === 0) {
    return (
      <p className="p-10 text-center text-muted-foreground md:p-12">
        {totalDocs > 0
          ? "This page is past the end of the results."
          : "No proposals match these filters."}
      </p>
    )
  }

  return (
    <div className="grid w-full gap-8 p-10 md:p-12 lg:grid-cols-2 lg:gap-10">
      {proposals.map((proposal) => {
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
            href={Routes.PROPOSALS.PROPOSAL(proposal.id, proposal.proposalSlug)}
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
