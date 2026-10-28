import { AnimatedSuspense } from "@repo/ui/components/ui"
import type { ComponentProps, ReactNode } from "react"
import { ErrorBoundary } from "./ErrorBoundary"
import type { ErrorState } from "./ErrorState"

type SuspenseSectionProps = {
  children: ReactNode
  fallback?: ReactNode
  errorTitle?: string
  errorVariant: ComponentProps<typeof ErrorState>["variant"]
  /** Repeats the placement classes the child sets on itself (grid slot, order, margin, mobile padding), so the error state takes the same slot. */
  errorPlacementClassName?: string
}

/** A section that streams in behind a skeleton and shows an ErrorState with retry if it throws. */
export const SuspenseSection = ({
  children,
  fallback,
  errorTitle,
  errorVariant,
  errorPlacementClassName,
}: SuspenseSectionProps) => (
  <ErrorBoundary
    placementClassName={errorPlacementClassName}
    title={errorTitle}
    variant={errorVariant}
  >
    <AnimatedSuspense fallback={fallback}>{children}</AnimatedSuspense>
  </ErrorBoundary>
)
