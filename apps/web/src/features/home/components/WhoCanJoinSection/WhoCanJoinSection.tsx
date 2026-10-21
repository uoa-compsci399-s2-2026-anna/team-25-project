import { AnimatedSuspense, Eyebrow, Heading } from "@repo/ui/components/ui"
import { JoinButtons, JoinButtonsSkeleton } from "./JoinButtons"

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
  // The last section on the page, so its own bottom padding is what keeps the
  // footer off it. The footer belongs to the layout, not here.
  return (
    <section className="px-8 pt-4 pb-6 sm:pt-12 sm:pb-20 md:px-16 md:pb-24">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Heading level="h2">Who can join</Heading>

          <ul className="flex flex-col gap-3 pl-8 text-muted-foreground">
            {criteria.map((criterion) => (
              <li className="flex items-start gap-3" key={criterion}>
                <span aria-hidden className="flex h-6 shrink-0 items-center">
                  <span className="size-1.5 rounded-xs bg-primary" />
                </span>
                {criterion}
              </li>
            ))}
          </ul>

          <AnimatedSuspense fallback={<JoinButtonsSkeleton />}>
            <JoinButtons />
          </AnimatedSuspense>
        </div>

        <div className="flex flex-col gap-6 rounded-lg bg-brand-blush/60 p-5 sm:p-8">
          <Eyebrow id={stepsLabelId}>How joining works</Eyebrow>
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
      </div>
    </section>
  )
}
