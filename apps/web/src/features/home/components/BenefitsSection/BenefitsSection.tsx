import { Button, Heading } from "@repo/ui/components/ui"
import Link from "next/link"
import { Routes } from "@/lib/routes"

const benefits = [
  "Become a part of a supportive community & have an opportunity to learn from other instructors",
  "Share ideas, join other projects and find collaborators",
  "Get access to the course data from other universities & course resources and tools",
]

export const BenefitsSection = () => {
  return (
    <section className="px-8 py-10 md:px-16">
      <Heading className="mb-8" level="h2">
        Benefits of being a member
      </Heading>

      <div className="flex flex-col gap-8 rounded-2xl bg-brand-blush/60 p-8">
        <ul className="flex flex-col gap-4">
          {benefits.map((benefit) => (
            <li className="flex items-start gap-4 text-muted-foreground" key={benefit}>
              {/* A plain rule rather than a bullet, matching the design. */}
              <span aria-hidden className="mt-3 h-px w-6 shrink-0 bg-border" />
              {benefit}
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center gap-4">
          <Button nativeButton={false} render={<Link href={Routes.LOGIN} />} variant="button-mauve">
            Log in
          </Button>
          <Button
            borderColor="charcoal"
            nativeButton={false}
            render={<Link href={Routes.REGISTER.ROOT} />}
            variant="button-transparent"
          >
            Register with your uni email
          </Button>
        </div>
      </div>
    </section>
  )
}
