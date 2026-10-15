import {
  ProposalEthicsStatusLabels,
  ProposalTimeframeEndPeriodLabels,
  ProposalTimeframeStartPeriodLabels,
} from "@repo/shared/enums/proposals"
import type { Proposal } from "@repo/shared/payload-types"
import { toSelectOptions } from "@repo/shared/utils/select-options"
import { cn } from "@repo/ui/lib/utils"
import { EditInput } from "@/components/Editor/EditInput"
import { EditNumberInput } from "@/components/Editor/EditNumberInput"
import { EditSelect } from "@/components/Editor/EditSelect"

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
    {
      label: "Timeframe",
      // Edited together so the timeframe is always sent whole; its end is kept as saved.
      value: (
        <div className="flex gap-2">
          <EditSelect
            label="Start period"
            name="timeframe.startPeriod"
            options={toSelectOptions(ProposalTimeframeStartPeriodLabels)}
            value={timeframe.startPeriod}
            view={formatTimeframe(timeframe)}
          />
          <EditNumberInput
            className="w-24"
            label="Start year"
            name="timeframe.startYear"
            value={timeframe.startYear}
          />
        </div>
      ),
    },
    {
      label: "Output target",
      value: (
        <EditInput
          label="Output target"
          name="outputTarget"
          value={outputTarget}
          view={outputTarget || "—"}
        />
      ),
    },
    {
      label: "Ethics",
      value: (
        <EditSelect
          label="Ethics"
          name="ethics"
          options={toSelectOptions(ProposalEthicsStatusLabels)}
          value={ethics}
          view={ProposalEthicsStatusLabels[ethics]}
        />
      ),
    },
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
          <div className="font-bold text-sm">{item.value}</div>
        </div>
      ))}
    </div>
  )
}
