"use client"

import { catchError } from "next/error"
import type { ReactNode } from "react"

function renderFallback({ fallback }: { fallback: ReactNode }) {
  return fallback
}

/** Shows `fallback` in place of children that throw, for spots too small for an ErrorState. */
export const FallbackOnError = catchError(renderFallback)
