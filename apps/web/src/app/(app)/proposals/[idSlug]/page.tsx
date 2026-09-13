import { RichText } from "@payloadcms/richtext-lexical/react"
import { Heading } from "@repo/ui/components/ui"
import { notFound } from "next/navigation"
import { AuthorByline } from "@/features/proposals/components/AuthorByline/AuthorByline"
import { ProposalMeta } from "@/features/proposals/components/ProposalMeta/ProposalMeta"
import { ProposalStatusRow } from "@/features/proposals/components/ProposalStatusRow/ProposalStatusRow"
import { StatusAuthorCard } from "@/features/proposals/components/StatusAuthorCard/StatusAuthorCard"
import { TagsCard } from "@/features/proposals/components/TagsCard/TagsCard"
import { getProposalById } from "@/lib/payload/getProposalById"

// pulls the id off the front, e.g. "12-peer-review" or just "12"
const parseProposalId = (idSlug: string) => {
  const id = Number(idSlug.split("-")[0])
  return Number.isInteger(id) ? id : null
}

export default async function Page({ params }: { params: Promise<{ idSlug: string }> }) {
  const { idSlug } = await params
  const id = parseProposalId(idSlug)

  if (id === null) {
    notFound()
  }

  const proposal = await getProposalById(id)

  if (!proposal) {
    notFound()
  }

  const authors = proposal.author.filter((author) => typeof author === "object")

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-8 py-12 lg:grid-cols-[1fr_320px]">
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
        <StatusAuthorCard status={proposal.status} updatedAt={proposal.updatedAt} />
        <TagsCard tags={proposal.tags} />
      </div>
    </div>
  )
}
