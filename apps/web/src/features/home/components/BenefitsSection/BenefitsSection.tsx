import { Heading } from "@repo/ui/components/ui"
import { Check } from "lucide-react"

const benefits = [
  "Become a part of a supportive community & have an opportunity to learn from other instructors",
  "Share ideas, join other projects and find collaborators",
  "Get access to the course data from other universities & course resources and tools",
]

export const BenefitsSection = () => {
  return (
    <section className="flex flex-col gap-8 px-8 py-4 sm:py-12 md:px-16">
      <Heading className="text-xl sm:text-2xl" level="h2">
        Benefits of being a member
      </Heading>

      <ul className="flex flex-col gap-4 rounded-lg bg-brand-blush/60 p-5 sm:p-8">
        {benefits.map((benefit) => (
          <li
            className="flex items-start gap-3 text-muted-foreground text-sm sm:text-base"
            key={benefit}
          >
            <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary sm:mt-1" />
            {benefit}
          </li>
        ))}
      </ul>
    </section>
  )
}
