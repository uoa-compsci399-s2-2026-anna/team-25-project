import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useId, useState } from "react"
import { Checkbox } from "./checkbox"

const meta: Meta<typeof Checkbox> = {
  title: "ui/Checkbox",
  component: Checkbox,
  args: {
    "aria-label": "Accept terms",
  },
}

export default meta
type Story = StoryObj<typeof Checkbox>

export const Default: Story = {}

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
}

export const Indeterminate: Story = {
  args: {
    indeterminate: true,
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export const DisabledChecked: Story = {
  args: {
    defaultChecked: true,
    disabled: true,
  },
}

export const WithLabel: Story = {
  render: (args) => {
    function LabeledCheckbox() {
      const id = useId()
      return (
        <div className="flex items-center gap-2 text-sm">
          <Checkbox {...args} aria-label={undefined} id={id} />
          <label htmlFor={id}>Accept terms and conditions</label>
        </div>
      )
    }
    return <LabeledCheckbox />
  },
}

export const Controlled: Story = {
  render: () => {
    function ControlledCheckbox() {
      const id = useId()
      const [checked, setChecked] = useState(false)
      return (
        <div className="flex items-center gap-2 text-sm">
          <Checkbox checked={checked} id={id} onCheckedChange={setChecked} />
          <label htmlFor={id}>{checked ? "Checked" : "Unchecked"}</label>
        </div>
      )
    }
    return <ControlledCheckbox />
  },
}
