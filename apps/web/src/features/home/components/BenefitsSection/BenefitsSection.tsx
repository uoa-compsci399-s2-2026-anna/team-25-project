import { Button, Heading } from "@repo/ui/components/ui"
import { Check } from "lucide-react"
import Link from "next/link"
import { Routes } from "@/lib/routes"

const benefits = [
  "Become a part of a supportive community & have an opportunity to learn from other instructors",
  "Share ideas, join other projects and find collaborators",
  "Get access to the course data from other universities & course resources and tools",
]

export const BenefitsSection = () => {
  return (
    <section className="flex flex-col gap-8 px-8 py-10 md:px-16">
      <Heading level="h2">Benefits of being a member</Heading>

      <div className="flex flex-col gap-8 rounded-2xl bg-brand-blush/60 p-8">
        <ul className="flex flex-col gap-4">
          {benefits.map((benefit) => (
            <li className="flex items-start gap-3 text-muted-foreground" key={benefit}>
              <Check aria-hidden className="mt-1 size-4 shrink-0 text-primary" />
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
