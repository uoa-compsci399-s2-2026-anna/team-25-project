import { Button, Eyebrow, Heading } from "@repo/ui/components/ui"
import Link from "next/link"
import { Routes } from "@/lib/routes"

export const HeroSection = () => {
  return (
    <section className="flex flex-col items-center gap-16 px-8 pt-20 pb-32 md:flex-row md:items-center md:justify-between md:px-16 md:pt-37 md:pb-37">
      <div className="flex max-w-2xl flex-col gap-8">
        <Eyebrow>Computing Capstone Community Australasia</Eyebrow>

        <Heading className="text-6xl md:text-7xl" level="h1">
          Find collaborators for your next capstone project.
        </Heading>

        <p className="text-muted-foreground text-xl">
          Academics across eight Australian and New Zealand universities post research ideas, find
          co-investigators, and compare how capstone courses are taught.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          {/* TODO: point to a real registration flow once it exists */}
          <Button
            nativeButton={false}
            render={<Link href={Routes.HOME} />}
            size="lg"
            variant="button-mauve"
          >
            Register with your uni email
          </Button>
          <Button
            className="border-brand-charcoal/30"
            nativeButton={false}
            render={<Link href={Routes.PROPOSALS.ROOT} />}
            size="lg"
            variant="button-transparent"
          >
            Browse proposals
          </Button>
        </div>
      </div>

      <div className="flex size-80 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground md:size-[32rem]">
        placeholder
      </div>
    </section>
  )
}
