"use client"

import {
  Button,
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Spinner,
} from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import { TriangleAlert } from "lucide-react"
import { useTransition } from "react"
import { variantClassNames } from "./EmptyState"

type ErrorStateProps = {
  variant: keyof typeof variantClassNames
  title?: string
  retry: () => void
  className?: string
}

/** What a page or section shows when it fails to render. */
export const ErrorState = ({
  variant,
  title = "Something went wrong",
  retry,
  className,
}: ErrorStateProps) => {
  const [isRetrying, startRetry] = useTransition()

  return (
    <Empty className={cn(variantClassNames[variant], className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TriangleAlert />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
      </EmptyHeader>
      <EmptyContent>
        <Button
          aria-busy={isRetrying}
          borderColor="charcoal"
          disabled={isRetrying}
          onClick={() => startRetry(() => retry())}
          variant="button-transparent"
        >
          {isRetrying && <Spinner size="sm" />}
          {isRetrying ? "Retrying…" : "Try again"}
        </Button>
      </EmptyContent>
    </Empty>
  )
}
