import { Eyebrow, Heading } from "@repo/ui/components/ui"

export const HeroSection = () => {
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

      {/* Holds the space the interactive map will take, which is its own ticket. */}
      <div className="flex justify-center md:flex-1">
        <div
          className="flex aspect-4/5 w-full max-w-sm items-center justify-center rounded-2xl bg-muted text-muted-foreground text-sm"
          data-testid="hero-map-placeholder"
        >
          Interactive map
        </div>
      </div>
    </section>
  )
}
