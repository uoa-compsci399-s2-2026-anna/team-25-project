import { Eyebrow, Heading } from "@repo/ui/components/ui"
import type { GlobeMarker } from "../../globe.queries"
import { HeroGlobe } from "../HeroGlobe/HeroGlobe"

export const HeroSection = ({ markers }: { markers: GlobeMarker[] }) => {
  return (
    <section className="flex flex-col items-center gap-12 px-8 pt-20 pb-32 md:flex-row md:px-16 md:pt-25 md:pb-25">
      <div className="flex max-w-3xl flex-col gap-8">
        <Eyebrow>Computing Capstone Community Australasia</Eyebrow>

        <Heading className="text-6xl md:text-7xl" level="h1">
          Join the Computing Capstone Community Australasia
        </Heading>

        <p className="text-muted-foreground text-xl">
          Academics across Australian and New Zealand universities post research ideas, find
          co-investigators, and compare how capstone courses are taught.
        </p>
      </div>

      {/* Takes the space the copy leaves and centres the globe in it, rather than
          pinning it to the section's right edge. */}
      <div className="flex justify-center md:flex-1">
        <HeroGlobe markers={markers} />
      </div>
    </section>
  )
}
