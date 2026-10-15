import { AnimatedSuspense, Heading } from "@repo/ui/components/ui"
import { notFound } from "next/navigation"
import { EditSwitch } from "@/components/Editor/EditField"
import { EditInput } from "@/components/Editor/EditInput"
import { EditRichText } from "@/components/Editor/EditRichText"
import { RichTextContent } from "@/components/RichTextContent"
import { AuthorByline } from "@/features/proposals/components/AuthorByline/AuthorByline"
import { ProposalEditProvider } from "@/features/proposals/components/ProposalEditor/ProposalEditProvider"
import { ProposalMeta } from "@/features/proposals/components/ProposalMeta/ProposalMeta"
import { ProposalMetaEditor } from "@/features/proposals/components/ProposalMeta/ProposalMetaEditor"
import { ProposalStatusRow } from "@/features/proposals/components/ProposalStatusRow/ProposalStatusRow"
import { StatusAuthorCardServer } from "@/features/proposals/components/StatusAuthorCard/StatusAuthorCardServer"
import { TagsCard } from "@/features/proposals/components/TagsCard/TagsCard"
import { TagsCardEditor } from "@/features/proposals/components/TagsCard/TagsCardEditor"
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
    // Context only, no DOM - the two columns below stay direct children of the page grid.
    <ProposalEditProvider proposalId={id}>
      <div className="flex flex-col gap-6">
        <ProposalStatusRow
          createdAt={proposal.createdAt}
          status={proposal.status}
          updatedAt={proposal.updatedAt}
        />
        <EditInput
          label="Title"
          name="title"
          value={proposal.title}
          view={<Heading level="h1">{proposal.title}</Heading>}
        />
        <AuthorByline authors={authors} />
        <EditInput
          label="Summary"
          maxLength={500}
          multiline
          name="summary"
          value={proposal.summary}
          view={<p className="text-muted-foreground">{proposal.summary}</p>}
        />
        <EditRichText
          className="[&_[contenteditable]]:min-h-72"
          label="Body"
          name="body"
          value={proposal.body}
          view={<RichTextContent data={proposal.body} />}
        />
        <EditSwitch
          view={
            <ProposalMeta
              ethics={proposal.ethics}
              outputTarget={proposal.outputTarget}
              timeframe={proposal.timeframe}
            />
          }
        >
          <ProposalMetaEditor
            ethics={proposal.ethics}
            outputTarget={proposal.outputTarget}
            timeframe={proposal.timeframe}
          />
        </EditSwitch>
      </div>

      <div className="flex flex-col gap-6">
        <AnimatedSuspense fallback={null}>
          <StatusAuthorCardServer id={id} />
        </AnimatedSuspense>
        <EditSwitch view={<TagsCard tags={proposal.tags} />}>
          <TagsCardEditor tags={proposal.tags} />
        </EditSwitch>
      </div>
    </ProposalEditProvider>
  )
}
