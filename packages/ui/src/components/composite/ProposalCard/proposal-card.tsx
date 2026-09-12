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

/** Matches `ProposalStatus` by value, without coupling the design system to it. */
type ProposalCardStatus = "active" | "closed"

type ProposalCardTag = {
  label: string
  /** Defaults to `blue`. Ignored once closed, where every tag greys out. */
  variant?: BadgeProps["variant"]
}

type ProposalCardAuthor = {
  name: string
  institution?: string
  /** Omit to fall back to the author's initials. */
  avatarSrc?: string
}

type ProposalCardLinkProps = {
  href: string
  className?: string
  children?: React.ReactNode
}

type ProposalCardProps = Omit<React.ComponentProps<"div">, "title"> & {
  title: string
  href?: string
  linkComponent?: React.ElementType<ProposalCardLinkProps>
  summary: string
  author: ProposalCardAuthor
  /** A `Date`, or any string `Date` can parse (an ISO timestamp from Payload). */
  postedAt: Date | string
  status?: ProposalCardStatus
  tags?: ProposalCardTag[]
  size?: "default" | "sm"
}

/**
 * Pinned so the server and browser agree; a reader's own zone could otherwise
 * format the same timestamp a day earlier and trip a hydration mismatch.
 */
const postedFormatter = new Intl.DateTimeFormat("en-NZ", {
  day: "numeric",
  month: "short",
  timeZone: "Pacific/Auckland",
  year: "numeric",
})

/**
 * Last two words, since these names usually carry a title ("Dr Anna Tui").
 * Spread so an astral-plane initial survives, and "?" so a blank name shows something.
 */
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => [...part].slice(0, 1).join(""))
    .join("")
    .toUpperCase() || "?"

function ProposalCard({
  author,
  className,
  href,
  linkComponent: LinkComponent = "a",
  postedAt,
  size = "default",
  status = "active",
  summary,
  tags,
  title,
  ...props
}: ProposalCardProps) {
  const isClosed = status === "closed"
  // Intl throws on an invalid date rather than formatting one, so drop the
  // line instead of taking the whole page down with it.
  const posted = new Date(postedAt)
  const postedLabel = Number.isNaN(posted.getTime()) ? null : postedFormatter.format(posted)

  return (
    <Card
      className={cn("relative data-[status=closed]:text-neutral-400", className)}
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

        {postedLabel && (
          // row-span-1 keeps the date out of row two, so the title and summary
          // run the full width instead of wrapping against a reserved gutter.
          <CardAction className="row-span-1">
            <time
              className="text-muted-foreground text-xs group-data-[status=closed]/card:text-neutral-400"
              dateTime={posted.toISOString()}
            >
              Posted {postedLabel}
            </time>
          </CardAction>
        )}

        {/* Grouped so these two sit closer than the header's own gap. */}
        <div className="col-span-full flex flex-col gap-1.5">
          <CardTitle>
            {href ? (
              <LinkComponent className="hover:underline" href={href}>
                {title}
              </LinkComponent>
            ) : (
              title
            )}
          </CardTitle>
          <CardDescription>{summary}</CardDescription>
        </div>
      </CardHeader>

      {tags && tags.length > 0 && (
        <CardContent className="flex-row flex-wrap gap-2">
          {/* Deduped by label: a repeat renders nothing useful and collides as a React key. */}
          {[...new Map(tags.map((tag) => [tag.label, tag])).values()].map((tag) => (
            <Badge key={tag.label} variant={isClosed ? "closed" : (tag.variant ?? "blue")}>
              {tag.label}
            </Badge>
          ))}
        </CardContent>
      )}

      <CardFooter className="flex-col items-stretch gap-3 border-t-0 bg-transparent pt-0">
        <Separator />
        <div className="flex min-w-0 items-center gap-2">
          {/* The name sits right beside it, so the photo itself is decorative. */}
          <Avatar className="group-data-[status=closed]/card:opacity-60">
            {author.avatarSrc && <AvatarImage alt="" src={author.avatarSrc} />}
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
