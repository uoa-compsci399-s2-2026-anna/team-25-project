"use client"

import { ErrorState } from "@/components/ErrorState"

export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <ErrorState
      className="min-h-[60svh]"
      retry={retry}
      title="We could not load this page."
      variant="page"
    />
  )
}
