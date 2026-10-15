import { ProposalTagLabels } from "@repo/shared/enums/proposals"
import type { Proposal } from "@repo/shared/payload-types"
import { toSelectOptions } from "@repo/shared/utils/select-options"
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui"
import { EditCheckboxList } from "@/components/Editor/EditCheckboxList"
import { EditSwitch } from "@/components/Editor/EditField"

export const TagsCard = ({ tags }: { tags: Proposal["tags"] }) => {
  const hasTags = Boolean(tags && tags.length > 0)

  const card = (
    <Card>
      <CardHeader>
        <CardTitle className="text-muted-foreground text-xs uppercase tracking-wide">
          Tags
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <EditCheckboxList
          label="Tags"
          name="tags"
          options={toSelectOptions(ProposalTagLabels)}
          value={tags}
          view={tags?.map((tag) => (
            <Badge className="uppercase tracking-wide" key={tag} variant="blue">
              {ProposalTagLabels[tag]}
            </Badge>
          ))}
        />
      </CardContent>
    </Card>
  )

  // With no tags the card stays hidden, except while editing so some can be added.
  return hasTags ? card : <EditSwitch>{card}</EditSwitch>
}
