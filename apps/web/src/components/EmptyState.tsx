import {
  buttonVariants,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import type { Route } from "next"
import Link from "next/link"
import type { ReactNode } from "react"

export const variantClassNames = {
  page: "p-10 md:p-24",
  list: "p-10 md:p-12",
  section: "border p-6",
  card: "border p-4",
}

// A not-found page has only the one way out, so its action is the main button.
const pageActionClassName = buttonVariants({ size: "lg", variant: "button-charcoal" })
const actionClassName = buttonVariants({ borderColor: "charcoal", variant: "button-transparent" })

type EmptyStateProps = {
  variant: keyof typeof variantClassNames
  icon: ReactNode
  title: string
  description?: ReactNode
  action?: { label: string; href: Route }
  className?: string
}

/** What a list or section shows when it has nothing in it. */
export const EmptyState = ({
  variant,
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) => (
  <Empty className={cn(variantClassNames[variant], className)}>
    <EmptyHeader>
      <EmptyMedia variant="icon">{icon}</EmptyMedia>
      <EmptyTitle>{title}</EmptyTitle>
      {description && <EmptyDescription>{description}</EmptyDescription>}
    </EmptyHeader>
    {action && (
      <EmptyContent>
        {/* A link styled as a button, so it keeps the link role. */}
        <Link
          className={variant === "page" ? pageActionClassName : actionClassName}
          href={action.href}
        >
          {action.label}
        </Link>
      </EmptyContent>
    )}
  </Empty>
)
