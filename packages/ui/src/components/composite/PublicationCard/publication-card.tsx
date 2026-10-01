import { PublicationTypeLabels } from "@repo/shared/enums/publications"
import type { Publication } from "@repo/shared/payload-types"
import { initialsFromName } from "@repo/shared/utils/initials"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Eyebrow,
  Separator,
  Skeleton,
} from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import { ExternalLink } from "lucide-react"
import type * as React from "react"
import { Fragment } from "react"
import { PublicationAbstract } from "./publication-abstract"

type PublicationCardLinkProps = {
  href: string
  className?: string
  children?: React.ReactNode
}

type PublicationCardProps = React.ComponentProps<"div"> & {
  publication: Publication
  /** Builds the profile link of an author who is a member. Omit to leave authors as text. */
  memberHref?: (memberId: number) => string
  /** Renders the author profile links, which stay on the site. */
  linkComponent?: React.ElementType<PublicationCardLinkProps>
  size?: "default" | "sm"
}

// UTC on both sides, so the month never shifts with the reader's zone.
const monthFormatter = new Intl.DateTimeFormat("en-NZ", {
  month: "short",
  timeZone: "UTC",
  year: "numeric",
})

const formatPublished = (year: number, month?: number | null) =>
  month && month >= 1 && month <= 12
    ? monthFormatter.format(new Date(Date.UTC(year, month - 1)))
    : String(year)

type PublicationAuthor = Publication["authors"][number]

const memberId = ({ member }: PublicationAuthor) =>
  typeof member === "object" ? member?.id : member

/** Only there when the query populated both the member and their avatar. */
const avatarSrc = ({ member }: PublicationAuthor) =>
  typeof member === "object" && typeof member?.avatar === "object" ? member.avatar?.url : undefined

const NewTabHint = () => <span className="sr-only"> (opens in a new tab)</span>

function PublicationCard({
  className,
  linkComponent: LinkComponent = "a",
  memberHref,
  publication,
  size = "default",
  ...props
}: PublicationCardProps) {
  const { abstract, authors, doi, month, tags, title, type, url, venue, year } = publication

  return (
    <Card className={cn("relative", className)} size={size} {...props}>
      <CardHeader className="gap-3">
        <Eyebrow className="md:text-xs">{PublicationTypeLabels[type]}</Eyebrow>

        {/* row-span-1 keeps the date out of row two, as in ProposalCard. */}
        <CardAction className="row-span-1">
          <span className="text-muted-foreground text-xs">
            Published {formatPublished(year, month)}
          </span>
        </CardAction>

        <div className="col-span-full flex flex-col gap-1.5">
          <CardTitle>
            {url ? (
              <a
                className="inline-flex items-baseline gap-1.5 hover:underline"
                href={url}
                rel="noopener noreferrer"
                target="_blank"
              >
                {title}
                <ExternalLink aria-hidden className="size-3.5 shrink-0 self-center" />
                <NewTabHint />
              </a>
            ) : (
              title
            )}
          </CardTitle>
          {venue && <p className="text-muted-foreground text-sm italic">{venue}</p>}
          {abstract && <PublicationAbstract>{abstract}</PublicationAbstract>}
        </div>
      </CardHeader>

      {tags && tags.length > 0 && (
        <CardContent className="flex-row flex-wrap gap-2">
          {[...new Set(tags)].map((tag) => (
            <Badge key={tag} variant="blue">
              {tag}
            </Badge>
          ))}
        </CardContent>
      )}

      <CardFooter className="flex-col items-stretch gap-3 border-t-0 bg-transparent pt-0">
        <Separator />
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <p className="text-sm leading-8">
            {authors.map((author, index) => {
              const id = memberId(author)
              const href = id != null ? memberHref?.(id) : undefined
              const src = avatarSrc(author)

              return (
                // Two authors can share a name, so the row id is the key.
                <Fragment key={author.id ?? index}>
                  {index > 0 && " "}
                  <span className="inline-block max-w-full">
                    {href ? (
                      <LinkComponent
                        className={cn(
                          "group/author inline-flex items-center gap-2 align-middle font-medium",
                          // Clears the avatar from the comma before it.
                          index > 0 && "ml-1",
                        )}
                        href={href}
                      >
                        {/* The name sits right beside it, so the photo and initials are decorative. */}
                        <Avatar aria-hidden size="sm">
                          {src && <AvatarImage alt="" src={src} />}
                          <AvatarFallback>{initialsFromName(author.name)}</AvatarFallback>
                        </Avatar>
                        <span className="underline decoration-brand-slate/30 underline-offset-4 group-hover/author:decoration-brand-slate">
                          {author.name}
                        </span>
                      </LinkComponent>
                    ) : (
                      author.name
                    )}
                    {index < authors.length - 1 && ","}
                  </span>
                </Fragment>
              )
            })}
          </p>
          {doi && (
            <a
              className="text-muted-foreground text-xs hover:underline"
              href={`https://doi.org/${doi}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              DOI {doi}
              <NewTabHint />
            </a>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

function PublicationCardSkeleton({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & Pick<PublicationCardProps, "size">) {
  return (
    <Card className={className} data-slot="publication-card-skeleton" size={size} {...props}>
      <CardHeader className="gap-3">
        <Skeleton className="h-4 w-28" />
        <CardAction className="row-span-1">
          <Skeleton className="h-4 w-28" />
        </CardAction>
        <div className="col-span-full flex flex-col gap-1.5">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardHeader>

      <CardFooter className="flex-col items-stretch gap-3 border-t-0 bg-transparent pt-0">
        <Separator />
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-3 w-36" />
        </div>
      </CardFooter>
    </Card>
  )
}

export { PublicationCard, type PublicationCardProps, PublicationCardSkeleton }
