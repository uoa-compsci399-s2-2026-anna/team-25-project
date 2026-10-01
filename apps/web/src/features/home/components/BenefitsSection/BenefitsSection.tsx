import { Heading } from "@repo/ui/components/ui"
import { Check } from "lucide-react"

const benefits = [
  "Become a part of a supportive community & have an opportunity to learn from other instructors",
  "Share ideas, join other projects and find collaborators",
  "Get access to the course data from other universities & course resources and tools",
]

export const BenefitsSection = () => {
  return (
    <section className="flex flex-col gap-8 px-8 py-10 md:px-16">
      <Heading level="h2">Benefits of being a member</Heading>

      <ul className="flex flex-col gap-4 rounded-2xl bg-brand-blush/60 p-8">
        {benefits.map((benefit) => (
          <li className="flex items-start gap-3 text-muted-foreground" key={benefit}>
            <Check aria-hidden className="mt-1 size-4 shrink-0 text-primary" />
            {benefit}
          </li>
        ))}
      </ul>
    </section>
  )
}
