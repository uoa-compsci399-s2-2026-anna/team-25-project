import { Button, Eyebrow, Heading } from "@repo/ui/components/ui"
import Link from "next/link"
import { Routes } from "@/lib/routes"

export default function NotFound() {
  return (
    <section className="flex min-h-[60svh] flex-col items-center justify-center gap-6 px-8 py-24 text-center md:px-16">
      <Eyebrow>404 Error</Eyebrow>
      <Heading className="max-w-2xl text-balance" level="h1">
        We cannot find that page.
      </Heading>
      <p className="max-w-md text-pretty text-lg text-muted-foreground">
        The page moved, or the link is wrong. Check the address, or head back home.
      </p>
      <Button
        nativeButton={false}
        render={<Link href={Routes.HOME} />}
        size="lg"
        variant="button-mauve"
      >
        Back to home
      </Button>
    </section>
  )
}
