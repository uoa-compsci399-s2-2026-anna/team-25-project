import { Button, Eyebrow, Heading } from "@repo/ui/components/ui"
import Link from "next/link"
import { Routes } from "@/lib/routes"
import { HeroGraphic } from "../HeroGraphic/HeroGraphic"

export const HeroSection = () => {
  return (
    <section className="flex flex-col items-center gap-12 px-8 pt-20 pb-32 md:flex-row md:px-16 md:pt-25 md:pb-25">
      {/* Capped so the headline wraps as the design does, rather than running the page width. */}
      <div className="flex max-w-3xl flex-col gap-8">
        <Eyebrow>Computing Capstone Community Australasia</Eyebrow>

        <Heading className="text-6xl md:text-7xl" level="h1">
          Join the Computing Capstone Community Australasia
        </Heading>

        <p className="text-muted-foreground text-xl">
          Academics across Australian and New Zealand universities post research ideas, find
          co-investigators, and compare how capstone courses are taught.
        </p>

        <Button
          className="w-fit"
          nativeButton={false}
          render={<Link href={Routes.REGISTER.ROOT} />}
          size="lg"
          variant="button-mauve"
        >
          Become a member
        </Button>
      </div>

      {/* Takes the space the copy leaves and centres the cap in it, rather than
          pinning it to the section's right edge. */}
      <div className="flex justify-center md:flex-1">
        <HeroGraphic className="w-64 shrink-0 md:w-80 lg:w-96" />
      </div>
    </section>
  )
}
