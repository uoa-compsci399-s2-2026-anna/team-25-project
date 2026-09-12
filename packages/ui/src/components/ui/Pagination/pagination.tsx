import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cn } from "@repo/ui/lib/utils"
import type { VariantProps } from "class-variance-authority"
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react"
import type * as React from "react"
import { buttonVariants } from "../Button/button"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      data-slot="pagination"
      {...props}
    />
  )
}

function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      className={cn("flex items-center gap-1", className)}
      data-slot="pagination-content"
      {...props}
    />
  )
}

function PaginationItem(props: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = useRender.ComponentProps<"a"> & {
  isActive?: boolean
  size?: VariantProps<typeof buttonVariants>["size"]
}

/** An `<a>` by default; pass `render` to use a router link or a non-link element. */
function PaginationLink({
  className,
  isActive = false,
  size = "icon",
  render,
  ...props
}: PaginationLinkProps) {
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(
      {
        "aria-current": isActive ? "page" : undefined,
        className: cn(
          buttonVariants({
            size,
            variant: isActive ? "button-charcoal" : "button-transparent",
          }),
          "aria-disabled:pointer-events-none aria-disabled:opacity-50",
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      active: isActive,
      slot: "pagination-link",
    },
  })
}

function PaginationPrevious({
  text = "Previous",
  ...props
}: PaginationLinkProps & { text?: string }) {
  return (
    <PaginationLink aria-label="Go to previous page" size="lg" {...props}>
      <ChevronLeftIcon data-icon="inline-start" />
      <span className="hidden sm:block">{text}</span>
    </PaginationLink>
  )
}

function PaginationNext({ text = "Next", ...props }: PaginationLinkProps & { text?: string }) {
  return (
    <PaginationLink aria-label="Go to next page" size="lg" {...props}>
      <span className="hidden sm:block">{text}</span>
      <ChevronRightIcon data-icon="inline-end" />
    </PaginationLink>
  )
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      className={cn("flex size-8 items-center justify-center text-brand-charcoal", className)}
      data-slot="pagination-ellipsis"
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  type PaginationLinkProps,
  PaginationNext,
  PaginationPrevious,
}
