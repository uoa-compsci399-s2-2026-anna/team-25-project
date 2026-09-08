import { Heading } from "@repo/ui/components/ui"
import { MemberBenefitCard } from "../MemberBenefitCard/MemberBenefitCard"

const benefits = [
  {
    description: "Find academics by university, role and research interest.",
    swatchClassName: "bg-brand-salmon",
    title: "Member directory",
  },
  {
    description:
      "Post a research idea, mark it active or closed, and gather interest from other institutions.",
    membersOnly: true,
    swatchClassName: "bg-violet-200",
    title: "Research proposals",
  },
  {
    description: "Compare structure, assessment and industry involvement course by course.",
    membersOnly: true,
    swatchClassName: "bg-blue-100",
    title: "Capstone course data",
  },
]

export const MembersSection = () => {
  return (
    <section className="px-8 py-16 md:px-16">
      <Heading className="mb-8" level="h2">
        What members get
      </Heading>
      <div className="grid gap-6 md:grid-cols-3">
        {benefits.map((benefit) => (
          <MemberBenefitCard key={benefit.title} {...benefit} />
        ))}
      </div>
    </section>
  )
}
