import {
  ProposalEthicsStatusLabels,
  ProposalTimeframeEndPeriodLabels,
  ProposalTimeframeStartPeriodLabels,
} from "@repo/shared/enums/proposals"
import type { Proposal } from "@repo/shared/payload-types"
import { cn } from "@repo/ui/lib/utils"

export const formatTimeframe = (timeframe: Proposal["timeframe"]) => {
  const start = `${ProposalTimeframeStartPeriodLabels[timeframe.startPeriod]} ${timeframe.startYear}`

  if (!timeframe.endYear || !timeframe.endPeriod) {
    return start
  }

  const end = `${ProposalTimeframeEndPeriodLabels[timeframe.endPeriod]} ${timeframe.endYear}`
  return `${start} → ${end}`
}

export const ProposalMeta = ({
  timeframe,
  outputTarget,
  ethics,
}: {
  timeframe: Proposal["timeframe"]
  outputTarget?: string | null
  ethics: Proposal["ethics"]
}) => {
  const items = [
    { label: "Timeframe", value: formatTimeframe(timeframe) },
    { label: "Output target", value: outputTarget || "—" },
    { label: "Ethics", value: ProposalEthicsStatusLabels[ethics] },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      {items.map((item, index) => (
        <div
          className={cn("flex flex-col gap-1", index > 0 && "sm:border-border sm:border-l sm:pl-8")}
          key={item.label}
        >
          <span className="text-muted-foreground text-xs uppercase tracking-wide">
            {item.label}
          </span>
          <span className="font-bold text-sm">{item.value}</span>
        </div>
      ))}
    </div>
  )
}
