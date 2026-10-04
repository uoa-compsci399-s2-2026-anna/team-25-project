import { initialsFromName } from "@repo/shared/utils/initials"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Separator,
  Skeleton,
} from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import type * as React from "react"

type ResourceCardOwner = {
  name: string
  href?: string
  /** Omit to fall back to the owner's initials. */
  avatarSrc?: string
}

type ResourceCardLinkProps = {
  href: string
  className?: string
  children?: React.ReactNode
}

type ResourceCardProps = Omit<React.ComponentProps<"div">, "title"> & {
  title: string
  href?: string
  linkComponent?: React.ElementType<ResourceCardLinkProps>
  /** Plain text: the caller flattens the resource's rich-text description. */
  summary?: string
  owner: ResourceCardOwner
  /** The related course's code, shown as a badge. */
  course?: string
  /** A `Date`, or any string `Date` can parse (an ISO timestamp from Payload). */
  sharedAt: Date | string
  size?: "default" | "sm"
}

// Pinned like ProposalCard's, so the server and browser format the same month.
const sharedFormatter = new Intl.DateTimeFormat("en-NZ", {
  month: "short",
  timeZone: "Pacific/Auckland",
  year: "numeric",
})

function ResourceCard({
  className,
  course,
  href,
  linkComponent: LinkComponent = "a",
  owner,
  sharedAt,
  size = "default",
  summary,
  title,
  ...props
}: ResourceCardProps) {
  // Intl throws on an invalid date, so drop it from the byline instead.
  const shared = new Date(sharedAt)
  const sharedLabel = Number.isNaN(shared.getTime()) ? null : sharedFormatter.format(shared)

  const byline = (
    <>
      {/* The name sits right beside it, so the photo and initials are decorative. */}
      <Avatar aria-hidden>
        {owner.avatarSrc && <AvatarImage alt="" src={owner.avatarSrc} />}
        <AvatarFallback>{initialsFromName(owner.name)}</AvatarFallback>
      </Avatar>
      <p className="truncate text-muted-foreground text-sm group-hover/owner:underline">
        Shared by {owner.name}
        {sharedLabel && (
          <>
            {" "}
            - <time dateTime={shared.toISOString()}>{sharedLabel}</time>
          </>
        )}
      </p>
    </>
  )

  return (
    <Card className={cn("relative", className)} size={size} {...props}>
      {/* The description's reserved second row would sit empty below the title
          when there is no course badge, leaving a gap above the footer. */}
      <CardHeader className="gap-3 has-data-[slot=card-description]:grid-rows-none">
        {course && (
          <Badge className="justify-self-start" variant="blue">
            {course}
          </Badge>
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
          {summary && <CardDescription className="line-clamp-2">{summary}</CardDescription>}
        </div>
      </CardHeader>

      <CardFooter className="flex-col items-stretch gap-3 border-t-0 bg-transparent pt-0">
        <Separator />
        {owner.href ? (
          <LinkComponent className="group/owner flex min-w-0 items-center gap-2" href={owner.href}>
            {byline}
          </LinkComponent>
        ) : (
          <div className="flex min-w-0 items-center gap-2">{byline}</div>
        )}
      </CardFooter>
    </Card>
  )
}

/** Holds a `ResourceCard`'s space while the listing loads. */
function ResourceCardSkeleton({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & Pick<ResourceCardProps, "size">) {
  return (
    // Hidden as a whole, so the divider isn't read out along with the empty boxes.
    <Card
      aria-hidden="true"
      className={className}
      data-slot="resource-card-skeleton"
      size={size}
      {...props}
    >
      <CardHeader className="gap-3">
        <Skeleton className="h-5 w-20 rounded-full" />
        <div className="col-span-full flex flex-col gap-1.5">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardHeader>

      <CardFooter className="flex-col items-stretch gap-3 border-t-0 bg-transparent pt-0">
        <Separator />
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-4 w-48" />
        </div>
      </CardFooter>
    </Card>
  )
}

export { ResourceCard, type ResourceCardOwner, type ResourceCardProps, ResourceCardSkeleton }
