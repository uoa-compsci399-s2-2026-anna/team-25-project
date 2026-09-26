import { Heading } from "@repo/ui/components/ui"
import { AboutCard } from "../AboutCard/AboutCard"

const about = [
  {
    description: "Maintain a directory of capstone academics and the courses they convene.",
    number: "01",
    title: "Member directory",
  },
  {
    description:
      "Record course data annually so designs can be compared across institutions, and host research proposals for members seeking co-investigators.",
    number: "02",
    title: "Research proposals",
  },
  {
    description: "Convene a workshop alongside ACE each year.",
    number: "03",
    title: "Workshop",
  },
]

export const AboutSection = () => {
  return (
    <section className="px-8 py-10 md:px-16">
      <Heading className="mb-8" level="h2">
        About us
      </Heading>
      <div className="grid gap-6 md:grid-cols-3">
        {about.map((item) => (
          <AboutCard key={item.title} {...item} />
        ))}
      </div>
    </section>
  )
}
