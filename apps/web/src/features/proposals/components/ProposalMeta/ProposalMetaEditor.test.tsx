import { ProposalEthicsStatus, ProposalTimeframeStartPeriod } from "@repo/shared/enums/proposals"
import { updateProposalSchema } from "@repo/shared/schemas/proposals"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { EditButton } from "@/components/Editor/EditButton"
import { EditProvider, zodFormErrors } from "@/components/Editor/EditContext"
import { ProposalMetaEditor } from "./ProposalMetaEditor"

const renderEditing = async () => {
  const user = userEvent.setup()
  const onSave = vi.fn().mockResolvedValue({ ok: true })
  render(
    <EditProvider onSave={onSave} validate={zodFormErrors(updateProposalSchema)}>
      <ProposalMetaEditor
        ethics={ProposalEthicsStatus.UNKNOWN}
        outputTarget="A journal"
        timeframe={{ startPeriod: ProposalTimeframeStartPeriod.SEM_1, startYear: 2027 }}
      />
      <EditButton />
    </EditProvider>,
  )
  await user.click(screen.getByRole("button", { name: "Edit" }))
  return { onSave, user }
}

describe("ProposalMetaEditor", () => {
  afterEach(() => {
    cleanup()
  })

  it("saves the timeframe fields together as one timeframe", async () => {
    const { onSave, user } = await renderEditing()

    const year = screen.getByRole("spinbutton", { name: "Start year" })
    await user.clear(year)
    await user.type(year, "2028")
    await user.click(screen.getByRole("button", { name: "Done" }))

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        ethics: ProposalEthicsStatus.UNKNOWN,
        outputTarget: "A journal",
        timeframe: { startPeriod: ProposalTimeframeStartPeriod.SEM_1, startYear: 2028 },
      }),
    )
  })

  it("shows the schema's error under the start year and doesn't save", async () => {
    const { onSave, user } = await renderEditing()

    const year = screen.getByRole("spinbutton", { name: "Start year" })
    await user.clear(year)
    await user.type(year, "1999")
    await user.click(screen.getByRole("button", { name: "Done" }))

    expect(await screen.findByText(/2000/)).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })
})
