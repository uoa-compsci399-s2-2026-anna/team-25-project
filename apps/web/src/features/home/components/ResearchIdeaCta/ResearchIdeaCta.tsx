import { Button, Heading } from "@repo/ui/components/ui"
import { Eye, Lock, Users } from "lucide-react"
import Link from "next/link"
import { Routes } from "@/lib/routes"

const benefits = [
  { icon: Users, label: "Find co-investigators across institutions" },
  { icon: Eye, label: "Track interest as it comes in" },
  { icon: Lock, label: "Shared in confidence with members only" },
]

export const ResearchIdeaCta = () => {
  return (
    <div className="flex h-full flex-col justify-between gap-6 rounded-2xl bg-primary p-8 text-primary-foreground">
      <div className="flex flex-col gap-4">
        <Heading className="text-primary-foreground" level="h3">
          Have a research idea?
        </Heading>
        <p className="text-primary-foreground/80">
          Post it as a proposal, keep it active while you're recruiting, and close it once your team
          is formed.
        </p>
        <ul className="flex flex-col gap-3">
          {benefits.map(({ icon: Icon, label }) => (
            <li className="flex items-center gap-2 text-primary-foreground/90 text-sm" key={label}>
              <Icon aria-hidden className="size-4 shrink-0" />
              {label}
            </li>
          ))}
        </ul>
      </div>

      {/* TODO: point to a real post-a-proposal flow once it exists - proposals list is the closest thing for now */}
      <Button
        className="w-fit"
        nativeButton={false}
        render={<Link href={Routes.PROPOSALS.ROOT} />}
        variant="button-white"
      >
        Post a proposal
      </Button>
    </div>
  )
}
