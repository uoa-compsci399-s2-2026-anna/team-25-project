import {
  buttonVariants,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/ui/components/ui"
import type { Route } from "next"
import Link from "next/link"
import type { ReactNode } from "react"

type EmptyStateProps = {
  icon: ReactNode
  title: string
  description?: ReactNode
  action?: { label: string; href: Route }
  className?: string
}

/** What a list or section shows when it has nothing in it. */
export const EmptyState = ({ icon, title, description, action, className }: EmptyStateProps) => (
  <Empty className={className}>
    <EmptyHeader>
      <EmptyMedia variant="icon">{icon}</EmptyMedia>
      <EmptyTitle>{title}</EmptyTitle>
      {description && <EmptyDescription>{description}</EmptyDescription>}
    </EmptyHeader>
    {action && (
      <EmptyContent>
        {/* A link styled as a button, so it keeps the link role. */}
        <Link
          className={buttonVariants({ borderColor: "charcoal", variant: "button-transparent" })}
          href={action.href}
        >
          {action.label}
        </Link>
      </EmptyContent>
    )}
  </Empty>
)
