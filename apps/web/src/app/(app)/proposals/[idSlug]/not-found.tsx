import { Button, Heading } from "@repo/ui/components/ui"
import Link from "next/link"
import { MemberOnly } from "@/features/auth/components/MemberOnly/MemberOnly"
import { Routes } from "@/lib/routes"

export default function NotFound() {
  return (
    <MemberOnly>
      <div className="flex flex-col items-center gap-4 p-10 text-center md:p-24">
        <Heading level="h2">This proposal is not available</Heading>
        <p className="max-w-prose text-muted-foreground">
          The proposal was removed, or the link is no longer valid.
        </p>
        <Button
          nativeButton={false}
          render={<Link href={Routes.PROPOSALS.ROOT} />}
          size="lg"
          variant="button-charcoal"
        >
          Browse proposals
        </Button>
      </div>
    </MemberOnly>
  )
}
