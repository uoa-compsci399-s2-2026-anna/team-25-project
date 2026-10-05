import { Heading } from "@repo/ui/components/ui"
import { AboutCard } from "../AboutCard/AboutCard"

const about = [
  {
    description: "Maintain a directory of capstone academics and the courses they convene.",
    number: "01",
    title: "Member directory",
  },
  {
    // Course comparison was its own card until the design merged it in here.
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
  // More above than below: this meets the ticker band, which leaves the heading
  // no room of its own.
  return (
    <section className="flex flex-col gap-8 px-8 pt-16 pb-12 md:px-16 md:pt-20">
      <Heading level="h2">About us</Heading>
      <div className="grid gap-6 md:grid-cols-3">
        {about.map((item) => (
          <AboutCard key={item.title} {...item} />
        ))}
      </div>
    </section>
  )
}
