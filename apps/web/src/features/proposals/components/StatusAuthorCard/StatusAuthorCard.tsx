import { ProposalStatusLabels } from "@repo/shared/enums/proposals"
import { toSelectOptions } from "@repo/shared/utils/select-options"
import { Card } from "@repo/ui/components/ui"
import { EditButton } from "@/components/Editor/EditButton"
import { EditSwitch } from "@/components/Editor/EditField"
import { EditTabs } from "@/components/Editor/EditTabs"
import { StartEditingOnLoad } from "@/components/Editor/StartEditingOnLoad"

const dateFormatter = new Intl.DateTimeFormat("en-NZ", {
  day: "numeric",
  month: "short",
  timeZone: "Pacific/Auckland",
  year: "numeric",
})

export const StatusAuthorCard = ({
  status,
  updatedAt,
}: {
  status: "active" | "closed"
  updatedAt: string
}) => {
  return (
    <Card className="flex flex-col gap-4 p-6">
      <span className="text-muted-foreground text-xs uppercase tracking-wide">Status - Author</span>

      {/* Only while editing - the page's status badge shows it otherwise. Saved with Done. */}
      <EditSwitch>
        <EditTabs
          label="Status"
          name="status"
          options={toSelectOptions(ProposalStatusLabels)}
          value={status}
        />
        <p className="text-muted-foreground text-sm">
          Closing keeps the proposal visible, but removes it from the active list and stops new
          interest.
        </p>
      </EditSwitch>

      <EditButton
        borderColor="charcoal"
        className="max-w-none items-stretch"
        label="Edit proposal"
        variant="button-transparent"
      />
      {/* This card only renders for people who can edit, so #edit does nothing for anyone else. */}
      <StartEditingOnLoad />

      <span className="text-center text-muted-foreground text-xs">
        Last edited {dateFormatter.format(new Date(updatedAt))}
      </span>
    </Card>
  )
}
