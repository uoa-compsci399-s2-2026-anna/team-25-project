import { Button, Heading } from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import Link from "next/link"
import { Routes } from "@/lib/routes"

const stats = [
  { label: "active proposals seeking collaborators", value: "27" },
  { label: "posted in the last 30 days", value: "6" },
  { label: "universities represented", value: "8" },
]

export const ProposalsPreviewPlaceholder = () => {
  return (
    <div className="flex flex-col gap-8 rounded-2xl bg-brand-blush/60 p-8">
      <div className="flex flex-col gap-2">
        <Heading level="h3">Log in to see proposals available</Heading>
        <p className="text-muted-foreground">
          Proposals are shared in confidence between CCCA members, so titles and details stay
          private until you sign in.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {stats.map((stat, index) => (
          <div
            className={cn(
              "flex flex-col gap-1",
              index > 0 && "sm:border-border sm:border-l sm:pl-8",
            )}
            key={stat.label}
          >
            <span className="font-bold text-4xl">{stat.value}</span>
            <span className="text-muted-foreground text-sm">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {/* TODO: point to a real login page once #70 (session helper) lands */}
        <Button nativeButton={false} render={<Link href={Routes.HOME} />} variant="button-mauve">
          Log in
        </Button>
        {/* TODO: point to a real registration flow once it exists */}
        <Button
          borderColor="charcoal"
          nativeButton={false}
          render={<Link href={Routes.HOME} />}
          variant="button-transparent"
        >
          Register with your uni email
        </Button>
      </div>
    </div>
  )
}
