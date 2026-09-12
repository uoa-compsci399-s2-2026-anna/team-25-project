import { cn } from "@repo/ui/lib/utils"
import { Check } from "lucide-react"

const STEPS = [
  { label: "Your details", step: 1 },
  { label: "Profile", step: 2 },
] as const

/**
 * Purely indicative: the two register steps are separate routes, so this
 * reflects where you are rather than offering navigation between them.
 */
export const RegisterStepper = ({ current }: { current: 1 | 2 }) => {
  return (
    <ol aria-label="Sign-up progress" className="flex items-center justify-center gap-3">
      {STEPS.map(({ label, step }, index) => {
        const isComplete = step < current
        const isCurrent = step === current

        return (
          <li className="flex items-center gap-3" key={step}>
            {index > 0 && <span aria-hidden="true" className="h-px w-10 bg-border" />}
            <span
              aria-current={isCurrent ? "step" : undefined}
              className="flex items-center gap-2 text-sm"
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-xs",
                  isComplete && "bg-brand-salmon text-brand-plum",
                  isCurrent && "bg-primary text-primary-foreground",
                  !(isComplete || isCurrent) && "border border-border text-muted-foreground",
                )}
              >
                {isComplete ? <Check className="size-3" /> : step}
              </span>
              <span className={cn(isCurrent ? "text-foreground" : "text-muted-foreground")}>
                {label}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
