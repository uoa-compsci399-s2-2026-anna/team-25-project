import { RichText } from "@payloadcms/richtext-lexical/react"
import { Heading } from "@repo/ui/components/ui"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { AuthorByline } from "@/features/proposals/components/AuthorByline/AuthorByline"
import { ProposalMeta } from "@/features/proposals/components/ProposalMeta/ProposalMeta"
import { ProposalStatusRow } from "@/features/proposals/components/ProposalStatusRow/ProposalStatusRow"
import { StatusAuthorCardServer } from "@/features/proposals/components/StatusAuthorCard/StatusAuthorCardServer"
import { TagsCard } from "@/features/proposals/components/TagsCard/TagsCard"
import { getProposalByIdCached } from "@/features/proposals/proposals.queries"

// pulls the id off the front, e.g. "12-peer-review" or just "12"
const parseProposalId = (idSlug: string) => {
  const id = Number(idSlug.split("-")[0])
  return Number.isInteger(id) ? id : null
}

export const ProposalPage = async ({ params }: { params: Promise<{ idSlug: string }> }) => {
  const { idSlug } = await params
  const id = parseProposalId(idSlug)

  if (id === null) {
    notFound()
  }

  const proposal = await getProposalByIdCached(id)

  if (!proposal) {
    notFound()
  }

  const authors = proposal.author.filter((author) => typeof author === "object")

  return (
    <>
      <div className="flex flex-col gap-6">
        <ProposalStatusRow
          createdAt={proposal.createdAt}
          status={proposal.status}
          updatedAt={proposal.updatedAt}
        />
        <Heading level="h1">{proposal.title}</Heading>
        <AuthorByline authors={authors} />
        <p className="text-muted-foreground">{proposal.summary}</p>
        <RichText data={proposal.body} />
        <ProposalMeta
          ethics={proposal.ethics}
          outputTarget={proposal.outputTarget}
          timeframe={proposal.timeframe}
        />
      </div>

      <div className="flex flex-col gap-6">
        <Suspense fallback={null}>
          <StatusAuthorCardServer id={id} />
        </Suspense>
        <TagsCard tags={proposal.tags} />
      </div>
    </>
  )
}
