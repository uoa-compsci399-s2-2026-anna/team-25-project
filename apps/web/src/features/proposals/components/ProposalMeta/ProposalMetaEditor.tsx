import {
  ProposalEthicsStatusLabels,
  ProposalTimeframeStartPeriodLabels,
} from "@repo/shared/enums/proposals"
import type { Proposal } from "@repo/shared/payload-types"
import { toSelectOptions } from "@repo/shared/utils/select-options"
import { cn } from "@repo/ui/lib/utils"
import type { ReactNode } from "react"
import { EditInput } from "@/components/Editor/EditInput"
import { EditNumberInput } from "@/components/Editor/EditNumberInput"
import { EditSelect } from "@/components/Editor/EditSelect"

const startPeriodOptions = toSelectOptions(ProposalTimeframeStartPeriodLabels)
const ethicsOptions = toSelectOptions(ProposalEthicsStatusLabels)

const Cell = ({
  children,
  first,
  label,
}: {
  children: ReactNode
  first?: boolean
  label: string
}) => (
  <div className={cn("flex flex-col gap-1", !first && "sm:border-border sm:border-l sm:pl-8")}>
    <span className="text-muted-foreground text-xs uppercase tracking-wide">{label}</span>
    {children}
  </div>
)

/**
 * ProposalMeta's fields as inputs, in the same three columns. Shown in place of ProposalMeta
 * via EditSwitch, so the fields need no view of their own. The end of the timeframe isn't
 * editable yet - the post form doesn't collect it either - and is kept as saved.
 */
export const ProposalMetaEditor = ({
  ethics,
  outputTarget,
  timeframe,
}: {
  ethics: Proposal["ethics"]
  outputTarget?: string | null
  timeframe: Proposal["timeframe"]
}) => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
    <Cell first label="Timeframe">
      <div className="flex gap-2">
        <EditSelect
          className="w-full"
          label="Start period"
          name="timeframe.startPeriod"
          options={startPeriodOptions}
          value={timeframe.startPeriod}
        />
        <EditNumberInput
          className="w-24"
          label="Start year"
          max={2100}
          min={2000}
          name="timeframe.startYear"
          value={timeframe.startYear}
        />
      </div>
    </Cell>
    <Cell label="Output target">
      <EditInput label="Output target" name="outputTarget" value={outputTarget} />
    </Cell>
    <Cell label="Ethics">
      <EditSelect
        className="w-full"
        label="Ethics"
        name="ethics"
        options={ethicsOptions}
        value={ethics}
      />
    </Cell>
  </div>
)
