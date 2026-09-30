import { AnimatedSuspense, Heading, Skeleton } from "@repo/ui/components/ui"
import { Logo } from "@/components/Logo"
import { siteLinks } from "@/features/layout/links"
import { FooterLinkList } from "./FooterLinkList"

const groups = {
  Explore: [siteLinks.home, siteLinks.members, siteLinks.courses, siteLinks.proposals],
  Community: [siteLinks.publications, siteLinks.resources],
  Contact: [siteLinks.privacy],
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
        {Object.entries(groups).map(([category, links]) => (
          <div className="flex flex-col gap-1" key={category}>
            <Heading className="uppercase" level="h6">
              {category}
            </Heading>
            <AnimatedSuspense
              fallback={
                <div className="flex flex-col">
                  {links
                    .filter((link) => !link.membersOnly)
                    .map((link) => (
                      <div className="flex h-6 items-center" key={link.name}>
                        <Skeleton className="h-4 w-16 rounded-full" />
                      </div>
                    ))}
                </div>
              }
            >
              <FooterLinkList links={links} />
            </AnimatedSuspense>
          </div>
        ))}
      </nav>
    </footer>
  )
}
