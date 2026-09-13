import { ProposalTagLabels } from "@repo/shared/enums/proposals"
import type { Proposal } from "@repo/shared/payload-types"
import { Badge, Card } from "@repo/ui/components/ui"

export const TagsCard = ({ tags }: { tags: Proposal["tags"] }) => {
  if (!tags || tags.length === 0) {
    return null
  }

  return (
    <Card className="flex flex-col gap-4 p-6">
      <span className="text-muted-foreground text-xs uppercase tracking-wide">Tags</span>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge className="uppercase tracking-wide" key={tag} variant="blue">
            {ProposalTagLabels[tag]}
          </Badge>
        ))}
      </div>
    </Card>
  )
}
