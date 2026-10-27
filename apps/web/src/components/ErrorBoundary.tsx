"use client"

import { catchError, type ErrorInfo } from "next/error"
import type { ComponentProps } from "react"
import { ErrorState } from "./ErrorState"

type ErrorBoundaryProps = Omit<ComponentProps<typeof ErrorState>, "retry" | "className"> & {
  /** Classes for a box around the error state, such as the grid slot or mobile padding of the section it replaces. */
  placementClassName?: string
}

function ErrorBoundaryFallback(
  { placementClassName, ...props }: ErrorBoundaryProps,
  { retry }: ErrorInfo,
) {
  return (
    <div className={placementClassName}>
      <ErrorState {...props} retry={retry} />
    </div>
  )
}

/** Shows an ErrorState with a retry button in place of children that throw. */
export const ErrorBoundary = catchError(ErrorBoundaryFallback)
