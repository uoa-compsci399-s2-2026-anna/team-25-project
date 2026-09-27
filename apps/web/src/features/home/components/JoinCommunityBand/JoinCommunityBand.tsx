import { Button, Heading } from "@repo/ui/components/ui"
import Link from "next/link"
import { Routes } from "@/lib/routes"

export const JoinCommunityBand = () => {
  return (
    <section className="px-8 pb-20 md:px-16">
      {/* No mauve-foreground token exists, so white follows how button-mauve pairs them. */}
      <div className="flex flex-col gap-4 rounded-2xl bg-brand-mauve p-8 text-white">
        <Heading className="text-white" level="h2">
          Want to be a part of the community?
        </Heading>
        <p className="text-white/80">
          Post a research idea, keep it active while you're recruiting, and close it once your team
          is formed.
        </p>
        {/* button-white hovers to a translucent charcoal, which lets the mauve
            through and makes the button vanish - an opaque blush instead. */}
        <Button
          className="w-fit hover:bg-brand-blush"
          nativeButton={false}
          render={<Link href={Routes.REGISTER.ROOT} />}
          variant="button-white"
        >
          Become a member
        </Button>
      </div>
    </section>
  )
}
