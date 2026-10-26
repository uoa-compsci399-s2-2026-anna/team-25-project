import { cleanup, render as rtlRender, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it } from "vitest"
import { z } from "zod"
import { EditButton } from "@/components/Editor/EditButton"
import { EditProvider } from "@/components/Editor/EditContext"
import { formatTimeframe, ProposalMeta } from "./ProposalMeta"

// ProposalMeta's fields are editable, so it renders inside an editor, as on the proposal page.
const render = (ui: ReactNode) =>
  rtlRender(
    <EditProvider onSave={async () => ({ ok: true })} schema={z.object({})}>
      {ui}
      <EditButton />
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

  it("shows an end year without an end period", () => {
    expect(formatTimeframe({ endYear: 2028, startPeriod: "summer", startYear: 2027 })).toBe(
      "Summer 2027 → 2028",
    )
  })

  it("treats a null end year as no end date", () => {
    expect(
      formatTimeframe({ endPeriod: null, endYear: null, startPeriod: "summer", startYear: 2027 }),
    ).toBe("Summer 2027")
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

  it("shows the end fields only while editing", async () => {
    const user = userEvent.setup()
    render(<ProposalMeta ethics="approved" outputTarget={null} timeframe={timeframe} />)
    expect(screen.queryByLabelText("End year")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Edit" }))

    expect(screen.getByLabelText("End year")).toHaveValue(2028)
    expect(screen.getByLabelText("End period")).toHaveTextContent("Mid")
  })
})
