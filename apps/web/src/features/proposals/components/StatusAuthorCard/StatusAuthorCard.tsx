import { Card, Tabs, TabsList, TabsTrigger } from "@repo/ui/components/ui"
import { EditButton } from "@/components/Editor/EditButton"
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

      {/* not clickable yet, just shows the current status - making it actually
          work is separate follow-up work */}
      <Tabs value={status}>
        <TabsList className="w-full" variant="segmented">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>
      </Tabs>

      <p className="text-muted-foreground text-sm">
        Closing keeps the proposal visible, but removes it from the active list and stops new
        interest.
      </p>

      {/* items-stretch makes the button fill the card's width. */}
      <EditButton
        borderColor="charcoal"
        className="max-w-none items-stretch"
        label="Edit proposal"
        variant="button-transparent"
      />
      {/* Here because this card only renders for people who can edit, e.g. arriving from
          the Edit link on their profile's proposal list. */}
      <StartEditingOnLoad />

      <span className="text-center text-muted-foreground text-xs">
        Last edited {dateFormatter.format(new Date(updatedAt))}
      </span>
    </Card>
  )
}
