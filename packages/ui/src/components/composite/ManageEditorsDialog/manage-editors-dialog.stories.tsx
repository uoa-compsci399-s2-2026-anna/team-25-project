import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import * as React from "react"
import { Button } from "../../ui/Button/button"
import type { MemberOption } from "../MemberPicker/member-picker"
import { sampleMembers, searchSampleMembers } from "../MemberPicker/member-picker.fixtures"
import { ManageEditorsDialog } from "./manage-editors-dialog"

const [owner, ...others] = sampleMembers as [MemberOption, ...MemberOption[]]

const meta: Meta<typeof ManageEditorsDialog> = {
  title: "composite/ManageEditorsDialog",
  component: ManageEditorsDialog,
}

export default meta
type Story = StoryObj<typeof ManageEditorsDialog>

const trigger = (
  <Button borderColor="charcoal" size="sm" type="button" variant="button-transparent">
    Manage editors
  </Button>
)

const Controlled = ({ initial, formError }: { initial: MemberOption[]; formError?: string }) => {
  const [editors, setEditors] = React.useState(initial)
  const [saving, setSaving] = React.useState<"editors" | "transfer" | undefined>(undefined)
  const simulate = (action: "editors" | "transfer") => {
    setSaving(action)
    setTimeout(() => setSaving(undefined), 1000)
  }

  return (
    <ManageEditorsDialog
      editors={editors}
      formError={formError}
      onEditorsChange={setEditors}
      onSave={() => simulate("editors")}
      onSearch={searchSampleMembers}
      onTransfer={() => simulate("transfer")}
      owner={owner}
      saving={saving}
      transferableIds={initial.map((editor) => editor.id)}
      trigger={trigger}
    />
  )
}

export const NoEditors: Story = { render: () => <Controlled initial={[]} /> }

export const WithEditors: Story = { render: () => <Controlled initial={others.slice(0, 2)} /> }

export const WithError: Story = {
  render: () => (
    <Controlled
      formError="Only the owner or an admin can manage editors."
      initial={others.slice(0, 1)}
    />
  ),
}
