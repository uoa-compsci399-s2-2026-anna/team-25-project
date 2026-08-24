import { Button, buttonVariants } from "@repo/ui/components/ui"
import Link from "next/dist/client/link"

export default function Page() {
  return (
    <div className="flex min-h-svh p-6">
      <div className="flex min-w-0 max-w-md flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">Project ready!</h1>
          <p>You may now add components and start building.</p>
          <p>We&apos;ve already added the button component for you.</p>

          <Link
            className={buttonVariants({
              variant: "button-charcoal",
              fontWeight: "normal",
              active: true,
            })}
            href="/"
          >
            Link Example
          </Link>
          <Button fontWeight="medium" size="xl" textSize="xl" variant="button-charcoal">
            Charcoal
          </Button>
          <Button borderColor="charcoal" borderWidth="thin" size="xl" variant="button-cream">
            Cream
          </Button>
          <Button
            borderColor="white"
            borderWidth="thin"
            fontWeight="normal"
            textSize="md"
            variant="button-white"
          >
            White
          </Button>
          <Button borderColor="charcoal" borderWidth="thick" variant="button-transparent">
            Transparent
          </Button>
          <Button borderColor="white" borderWidth="thick" variant="button-mauve">
            Mauve
          </Button>
        </div>
        <div className="font-mono text-muted-foreground text-xs">
          (Press <kbd>d</kbd> to toggle dark mode)
        </div>
      </div>
    </div>
  )
}
