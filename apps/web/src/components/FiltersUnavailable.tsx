"use client"

import type { Route } from "next"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { PageContainer } from "@/features/layout/components/PageContainer/PageContainer"

/**
 * What a filter bar falls back to when it fails. With no filter in the URL it shows nothing.
 * With a filter set, the list is still filtered, so it says so and links to the unfiltered page.
 */
export const FiltersUnavailable = ({ clearHref }: { clearHref: Route }) => {
  const searchParams = useSearchParams()
  const hasFilters = [...searchParams.keys()].some((key) => key !== "page")
  if (!hasFilters) return null

  return (
    <PageContainer className="px-10 py-4 text-muted-foreground text-sm md:px-12">
      The filters could not load, but the list is still filtered.{" "}
      <Link className="underline underline-offset-2" href={clearHref}>
        Clear filters
      </Link>
    </PageContainer>
  )
}
