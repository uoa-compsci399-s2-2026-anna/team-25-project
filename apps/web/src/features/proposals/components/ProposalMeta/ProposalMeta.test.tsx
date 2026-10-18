import { cleanup, render as rtlRender, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it } from "vitest"
import { z } from "zod"
import { EditProvider } from "@/components/Editor/EditContext"
import { formatTimeframe, ProposalMeta } from "./ProposalMeta"

// ProposalMeta's fields are editable, so it renders inside an editor, as on the proposal page.
const render = (ui: ReactNode) =>
  rtlRender(
    <EditProvider onSave={async () => ({ ok: true })} schema={z.object({})}>
      {ui}
    </EditProvider>,
  )

describe("formatTimeframe", () => {
  it("formats a start-only timeframe", () => {
    expect(formatTimeframe({ startPeriod: "sem1", startYear: 2027 })).toBe("Semester 1 2027")
  })

  it("formats a start and end timeframe with an arrow", () => {
    expect(
      formatTimeframe({
        endPeriod: "mid",
        endYear: 2028,
        startPeriod: "sem1",
        startYear: 2027,
      }),
    ).toBe("Semester 1 2027 → Mid 2028")
  })

  it("treats a missing end period the same as no end date", () => {
    expect(formatTimeframe({ endYear: 2028, startPeriod: "summer", startYear: 2027 })).toBe(
      "Summer 2027",
    )
  })
})

describe("ProposalMeta", () => {
  afterEach(() => {
    cleanup()
  })

  const timeframe = {
    endPeriod: "mid",
    endYear: 2028,
    startPeriod: "sem1",
    startYear: 2027,
  } as const

  it("renders the formatted timeframe", () => {
    render(<ProposalMeta ethics="approved" outputTarget="ACE 2027 paper" timeframe={timeframe} />)
    expect(screen.getByText("Semester 1 2027 → Mid 2028")).toBeInTheDocument()
  })

  it("renders the output target", () => {
    render(<ProposalMeta ethics="approved" outputTarget="ACE 2027 paper" timeframe={timeframe} />)
    expect(screen.getByText("ACE 2027 paper")).toBeInTheDocument()
  })

  it("shows a placeholder when there is no output target", () => {
    render(<ProposalMeta ethics="approved" outputTarget={null} timeframe={timeframe} />)
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("renders the ethics label", () => {
    render(
      <ProposalMeta ethics="amendmentNeeded" outputTarget="ACE 2027 paper" timeframe={timeframe} />,
    )
    expect(screen.getByText("Amendment needed")).toBeInTheDocument()
  })
})
