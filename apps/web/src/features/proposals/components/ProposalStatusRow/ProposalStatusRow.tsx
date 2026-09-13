import { Badge } from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"

// same fixed timezone as ProposalCard, so the date is the same for everyone
const dateFormatter = new Intl.DateTimeFormat("en-NZ", {
  day: "numeric",
  month: "short",
  timeZone: "Pacific/Auckland",
  year: "numeric",
})

export const ProposalStatusRow = ({
  status,
  createdAt,
  updatedAt,
}: {
  status: "active" | "closed"
  createdAt: string
  updatedAt: string
}) => {
  const isClosed = status === "closed"
  const posted = dateFormatter.format(new Date(createdAt))
  const updated = dateFormatter.format(new Date(updatedAt))

  return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm">
      <Badge className="uppercase tracking-wide" variant={isClosed ? "closed" : "active"}>
        <span
          className={cn("size-1.5 rounded-full", isClosed ? "bg-neutral-400" : "bg-brand-rose")}
          data-icon="inline-start"
        />
        {isClosed ? "Closed" : "Active"}
      </Badge>
      <span>Posted {posted}</span>
      {updated !== posted && (
        <>
          <span aria-hidden>-</span>
          <span>updated {updated}</span>
        </>
      )}
    </div>
  )
}
