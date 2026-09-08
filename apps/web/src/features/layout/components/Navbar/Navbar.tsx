import { Avatar, AvatarFallback, buttonVariants } from "@repo/ui/components/ui"
import Link from "next/link"
import { Routes } from "@/lib/routes"

const links = [
  { name: "About", href: Routes.ABOUT },
  { name: "Members", href: Routes.MEMBERS.ROOT },
  { name: "Courses", href: Routes.COURSES.ROOT },
  { name: "Proposals", href: Routes.PROPOSALS.ROOT },
  // TODO: point to the real Resources/News pages once #16 lands
  { name: "Resources", href: Routes.HOME },
  { name: "News", href: Routes.HOME },
]

export const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-4 border-border border-b bg-brand-blush/60 px-4 py-4 backdrop-blur-sm md:px-8">
      <Link className="flex items-center gap-2" href={Routes.HOME}>
        <Avatar>
          <AvatarFallback />
        </Avatar>
        <span className="font-bold text-lg">CCCA</span>
      </Link>

      <nav aria-label="Main" className="flex items-center gap-5">
        {links.map((link) => (
          <Link className="text-base" href={link.href} key={link.name}>
            {link.name}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        {/* TODO: point to a real login page once #70 (session helper) lands */}
        <Link className="text-base" href={Routes.HOME}>
          Log in
        </Link>
        <Link
          className={buttonVariants({ className: "rounded-full", size: "sm" })}
          href={Routes.HOME}
        >
          Join CCCA
        </Link>
      </div>
    </header>
  )
}
