import { Heading } from "@repo/ui/components/ui"
import Link from "next/link"
import { Routes } from "@/lib/routes"

const links = {
  Explore: [
    { name: "Members", href: Routes.MEMBERS.ROOT },
    { name: "Courses", href: Routes.COURSES.ROOT },
    { name: "Proposals", href: Routes.PROPOSALS.ROOT },
  ],
  Community: [{ name: "About", href: Routes.ABOUT }],
  Contact: [{ name: "Privacy", href: Routes.PRIVACY }],
}

export const Footer = () => {
  return (
    <footer className="flex flex-row justify-between gap-8 bg-brand-blush px-16 py-12 text-brand-charcoal">
      <div className="flex max-w-sm flex-col">
        <Heading className="text-black" level="h3">
          CCCA
        </Heading>
        <p className="text-pretty">
          Computing Capstone Community Australasia.
          <br />A community of practice, not a publisher.
        </p>
      </div>
      <nav aria-label="Footer" className="flex flex-row gap-10">
        {Object.entries(links).map(([category, items]) => (
          <div className="flex flex-col gap-1" key={category}>
            <Heading className="uppercase" level="h6">
              {category}
            </Heading>
            <ul>
              {items.map((item) => (
                <li key={item.name}>
                  <Link href={item.href}>{item.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </footer>
  )
}
