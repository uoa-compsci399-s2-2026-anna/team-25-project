import { ProposalTagLabels } from "@repo/shared/enums/proposals"
import { PaginationNav, ProposalCard } from "@repo/ui/components/composite"
import type { Route } from "next"
import Link from "next/link"
import type { SearchParams } from "nuqs/server"
import { StringHrefLink } from "@/components/StringHrefLink"
import { Routes } from "@/lib/routes"
import { loadProposalsPage } from "../proposals.queries"
import {
  loadProposalSearchParams,
  serializeProposalSearchParams,
  toProposalFilters,
} from "../proposals.search-params"

const PAGE_SIZE = 10

export const ProposalsList = async ({ searchParams }: { searchParams: Promise<SearchParams> }) => {
  const params = await loadProposalSearchParams(searchParams)
  const {
    docs: proposals,
    totalDocs,
    totalPages,
  } = await loadProposalsPage(toProposalFilters(params), {
    limit: PAGE_SIZE,
    page: params.page,
  })

  // Keeps the current filters, so moving between pages only changes the page.
  const getPageHref = (page: number) =>
    serializeProposalSearchParams(Routes.PROPOSALS.ROOT, { ...params, page }) as Route

  if (proposals.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground md:p-12">
        {totalDocs > 0 ? (
          <>
            <p>This page is past the end of the results.</p>
            <Link className="underline underline-offset-2" href={getPageHref(totalPages)}>
              Go to the last page
            </Link>
          </>
        ) : (
          <p>No proposals match these filters.</p>
        )}
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-8 p-10 md:p-12">
      <div className="grid w-full gap-8 lg:grid-cols-2 lg:gap-10">
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
                href: author ? Routes.MEMBERS.MEMBER(author.id) : undefined,
                institution: institution?.name,
                name: author ? `${author.firstName} ${author.lastName}` : "Unknown author",
              }}
              href={Routes.PROPOSALS.PROPOSAL(proposal.id, proposal.proposalSlug)}
              key={proposal.id}
              linkComponent={StringHrefLink}
              postedAt={proposal.createdAt}
              status={proposal.status}
              summary={proposal.summary}
              tags={proposal.tags?.map((tag) => ({ label: ProposalTagLabels[tag] }))}
              title={proposal.title}
            />
          )
        })}
      </div>
      <PaginationNav
        getHref={getPageHref}
        linkComponent={StringHrefLink}
        page={params.page}
        totalPages={totalPages}
      />
    </div>
  )
}
