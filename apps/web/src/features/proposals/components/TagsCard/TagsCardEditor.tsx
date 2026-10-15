import { ProposalTagLabels } from "@repo/shared/enums/proposals"
import type { Proposal } from "@repo/shared/payload-types"
import { toSelectOptions } from "@repo/shared/utils/select-options"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui"
import { EditCheckboxList } from "@/components/Editor/EditCheckboxList"

const tagOptions = toSelectOptions(ProposalTagLabels)

/**
 * TagsCard while editing. Always shown, unlike TagsCard, which hides itself when there are
 * no tags - otherwise a proposal without tags could never get any.
 */
export const TagsCardEditor = ({ tags }: { tags: Proposal["tags"] }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-muted-foreground text-xs uppercase tracking-wide">Tags</CardTitle>
    </CardHeader>
    <CardContent>
      <EditCheckboxList label="Tags" name="tags" options={tagOptions} value={tags} />
    </CardContent>
  </Card>
)
