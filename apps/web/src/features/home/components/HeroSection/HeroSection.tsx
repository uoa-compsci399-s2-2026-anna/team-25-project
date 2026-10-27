import { Eyebrow, Heading } from "@repo/ui/components/ui"
import { Suspense } from "react"
import { FallbackOnError } from "@/components/FallbackOnError"
import { HeroGlobeSkeleton, InstitutionsGlobe } from "../HeroGlobe/InstitutionsGlobe"

export const HeroSection = () => {
  return (
    <section className="flex flex-col items-center gap-12 px-8 pt-15 pb-4 md:px-16 md:pt-25 md:pb-25 lg:flex-row">
      <div className="flex max-w-3xl flex-col gap-8 lg:min-w-0 lg:flex-1">
        <Eyebrow>Computing Capstone Community Australasia</Eyebrow>

        <Heading className="text-5xl sm:text-6xl md:text-7xl" level="h1">
          Join the Computing Capstone Community Australasia
        </Heading>

        <p className="text-lg text-muted-foreground sm:text-xl">
          Academics across Australian and New Zealand universities post research ideas, find
          co-investigators, and compare how capstone courses are taught.
        </p>
      </div>

      {/* Splits the row evenly with the copy. The globe sits towards the right of its half,
          with padding so it isn't pinned to the section's edge. */}
      <div className="flex justify-center lg:min-w-0 lg:flex-1 lg:justify-end lg:pr-12">
        {/* Decorative, so it hides on error and leaves the copy on its own. */}
        <FallbackOnError fallback={null}>
          <Suspense fallback={<HeroGlobeSkeleton />}>
            <InstitutionsGlobe />
          </Suspense>
        </FallbackOnError>
      </div>
    </section>
  )
}
