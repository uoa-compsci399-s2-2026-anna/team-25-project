import { Heading } from "@repo/ui/components/ui"
import Link from "next/link"
import { Logo } from "@/components/Logo"
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
    <footer className="flex w-full flex-row flex-wrap justify-between gap-8 bg-brand-blush p-8 text-brand-charcoal md:px-16 md:py-12">
      <div className="flex max-w-sm flex-col">
        <div className="flex items-center gap-2">
          <Logo className="w-12 shrink-0" />
          <Heading level="h3">CCCA</Heading>
        </div>
        <p className="text-pretty">
          Computing Capstone Community Australasia.
          <br />A community of practice, not a publisher.
        </p>
      </div>
      <nav aria-label="Footer" className="flex flex-wrap gap-10 sm:flex-row sm:flex-nowrap">
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
