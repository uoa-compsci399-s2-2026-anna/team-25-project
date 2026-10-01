import { Button, Eyebrow, Heading } from "@repo/ui/components/ui"
import Link from "next/link"
import { Routes } from "@/lib/routes"

const criteria = [
  "Academics and teaching staff involved in computing capstone courses",
  "At a university in Australia or New Zealand",
  "Verified by an institutional email address",
]

const stepsLabelId = "how-joining-works"

const steps = [
  { description: "From the list of member institutions.", title: "Pick your university" },
  {
    description: "Role, research interests and the courses you convene.",
    title: "Complete your profile",
  },
]

export const WhoCanJoinSection = () => {
  return (
    <section className="grid gap-8 px-8 py-10 md:grid-cols-2 md:px-16">
      <div className="flex flex-col gap-6">
        <Heading level="h2">Who can join</Heading>

        <ul className="flex flex-col gap-3 text-muted-foreground">
          {criteria.map((criterion) => (
            <li className="flex items-start gap-3" key={criterion}>
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              {criterion}
            </li>
          ))}
        </ul>

        <Button
          className="w-fit"
          nativeButton={false}
          render={<Link href={Routes.REGISTER.ROOT} />}
          variant="button-mauve"
        >
          Register with your uni email
        </Button>
      </div>

      <div className="flex flex-col gap-6 rounded-2xl bg-brand-blush/60 p-8">
        {/* Rendered once per page, so a fixed id is enough to name the list. */}
        <Eyebrow id={stepsLabelId}>How joining works</Eyebrow>
        {/* An ol already carries the order, so the drawn numbers are decoration -
            without aria-hidden each step would be announced twice over. */}
        <ol aria-labelledby={stepsLabelId} className="flex flex-col gap-4">
          {steps.map((step, index) => (
            <li className="flex items-start gap-4" key={step.title}>
              <span
                aria-hidden
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-background font-semibold text-primary text-sm"
              >
                {index + 1}
              </span>
              <div className="flex flex-col gap-1">
                <p className="font-semibold">{step.title}</p>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
