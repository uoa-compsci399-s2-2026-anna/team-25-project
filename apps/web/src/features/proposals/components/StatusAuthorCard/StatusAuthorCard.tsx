import { Button, Card, Tabs, TabsList, TabsTrigger } from "@repo/ui/components/ui"
import Link from "next/link"
import { Routes } from "@/lib/routes"

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

      {/* TODO: point to a real edit-proposal page once it exists */}
      <Button
        borderColor="charcoal"
        className="w-full"
        nativeButton={false}
        render={<Link href={Routes.HOME} />}
        variant="button-transparent"
      >
        Edit proposal
      </Button>

      <span className="text-center text-muted-foreground text-xs">
        Last edited {dateFormatter.format(new Date(updatedAt))}
      </span>
    </Card>
  )
}
