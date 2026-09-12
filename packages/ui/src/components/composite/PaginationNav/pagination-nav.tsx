import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@repo/ui/components/ui"
import type * as React from "react"

/** The link gets anchor props, such as `aria-current` and `aria-label`, and must pass them on. */
type PaginationNavLinkProps = Omit<React.ComponentPropsWithRef<"a">, "href"> & { href: string }

type PaginationNavProps = Omit<React.ComponentProps<"nav">, "children"> & {
  /** The current page, starting at 1. */
  page: number
  totalPages: number
  getHref: (page: number) => string
  linkComponent?: React.ElementType<PaginationNavLinkProps>
}

type PageRangeItem = number | "ellipsis"

/**
 * The pages to show: always the first and last, plus `siblings` on each side of the current page.
 * A gap of one page shows that page, since an ellipsis there takes the same room.
 */
function getPageRange(page: number, totalPages: number, siblings = 1): PageRangeItem[] {
  const start = Math.max(2, page - siblings)
  const end = Math.min(totalPages - 1, page + siblings)
  const range: PageRangeItem[] = [1]

  if (start === 3) range.push(2)
  else if (start > 3) range.push("ellipsis")

  for (let current = start; current <= end; current++) range.push(current)

  if (end === totalPages - 2) range.push(totalPages - 1)
  else if (end < totalPages - 2) range.push("ellipsis")

  if (totalPages > 1) range.push(totalPages)
  return range
}

/** Renders nothing for a single page. */
function PaginationNav({
  page,
  totalPages,
  getHref,
  linkComponent: LinkComponent = "a",
  ...props
}: PaginationNavProps) {
  if (totalPages <= 1) return null

  const linkTo = (target: number) => <LinkComponent href={getHref(target)} />
  // A disabled button lets screen readers announce the label and the disabled state.
  const disabled = <button disabled type="button" />

  return (
    <Pagination {...props}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious render={page > 1 ? linkTo(page - 1) : disabled} />
        </PaginationItem>
        {getPageRange(page, totalPages).map((item, index) => (
          // Two ellipses can appear, so their key needs the position.
          <PaginationItem key={item === "ellipsis" ? `ellipsis-${index}` : item}>
            {item === "ellipsis" ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink isActive={item === page} render={linkTo(item)}>
                {item}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext render={page < totalPages ? linkTo(page + 1) : disabled} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export { getPageRange, type PageRangeItem, PaginationNav, type PaginationNavProps }
