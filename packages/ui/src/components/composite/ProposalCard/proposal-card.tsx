import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  type BadgeProps,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Separator,
} from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import type * as React from "react"

/**
 * Kept as a plain union rather than importing the `ProposalStatus` enum so the
 * design system stays free of domain packages. The values match it exactly, so
 * a Payload `proposal.status` still assigns straight into this prop.
 */
type ProposalCardStatus = "active" | "closed"

type ProposalCardTag = {
  label: string
  /**
   * Defaults to `blue`. Ignored while the proposal is closed, where every tag
   * greys out along with the rest of the card.
   */
  variant?: BadgeProps["variant"]
}

type ProposalCardAuthor = {
  name: string
  institution?: string
  /**
   * Photo of the author, labelled with their name. Omit it to fall back to
   * their initials.
   */
  avatarSrc?: string
}

type ProposalCardProps = Omit<React.ComponentProps<"div">, "title"> & {
  title: string
  summary: string
  author: ProposalCardAuthor
  /** A `Date`, or any string `Date` can parse (an ISO timestamp from Payload). */
  postedAt: Date | string
  status?: ProposalCardStatus
  tags?: ProposalCardTag[]
  size?: "default" | "sm"
}

/**
 * Pinned to one locale and time zone so the server and the browser always agree
 * on the rendered string. Left to the runtime, a reader outside NZ could format
 * the same timestamp a day earlier and trip a hydration mismatch.
 */
const postedFormatter = new Intl.DateTimeFormat("en-NZ", {
  day: "numeric",
  month: "short",
  timeZone: "Pacific/Auckland",
  year: "numeric",
})

/**
 * Academic names here usually carry a title ("Dr Anna Tui"), so the last two
 * words are the given and family name far more often than the first two are.
 */
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()

function ProposalCard({
  author,
  className,
  postedAt,
  size = "default",
  status = "active",
  summary,
  tags,
  title,
  ...props
}: ProposalCardProps) {
  const isClosed = status === "closed"

  return (
    <Card
      className={cn("gap-4 data-[status=closed]:text-neutral-400", className)}
      data-status={status}
      size={size}
      {...props}
    >
      <CardHeader className="gap-3">
        <Badge className="uppercase tracking-wide" variant={isClosed ? "closed" : "active"}>
          <span
            className={cn("size-1.5 rounded-full", isClosed ? "bg-neutral-400" : "bg-brand-rose")}
            data-icon="inline-start"
          />
          {isClosed ? "Closed" : "Active"}
        </Badge>

        <CardAction>
          <span className="text-muted-foreground text-xs group-data-[status=closed]/card:text-neutral-400">
            Posted {postedFormatter.format(new Date(postedAt))}
          </span>
        </CardAction>

        {/* Grouped so the title and summary sit closer together than the header's own gap. */}
        <div className="flex flex-col gap-1.5">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{summary}</CardDescription>
        </div>
      </CardHeader>

      {tags && tags.length > 0 && (
        <CardContent className="flex-row flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag.label} variant={isClosed ? "closed" : (tag.variant ?? "blue")}>
              {tag.label}
            </Badge>
          ))}
        </CardContent>
      )}

      <CardFooter className="flex-col items-stretch gap-3 border-t-0 bg-transparent pt-0">
        <Separator />
        <div className="flex min-w-0 items-center gap-2">
          <Avatar>
            {author.avatarSrc && <AvatarImage alt={author.name} src={author.avatarSrc} />}
            <AvatarFallback>{initials(author.name)}</AvatarFallback>
          </Avatar>
          <p className="truncate text-muted-foreground text-sm group-data-[status=closed]/card:text-neutral-400">
            {author.institution ? `${author.name} - ${author.institution}` : author.name}
          </p>
        </div>
      </CardFooter>
    </Card>
  )
}

export {
  ProposalCard,
  type ProposalCardAuthor,
  type ProposalCardProps,
  type ProposalCardStatus,
  type ProposalCardTag,
}
