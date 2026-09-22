import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import * as React from "react"
import { Input } from "../Input/input"
import { Label } from "./label"

const meta: Meta<typeof Label> = {
  title: "ui/Forms/Label",
  component: Label,
}

export default meta
type Story = StoryObj<typeof Label>

export const Primary: Story = {
  render: () => <Label htmlFor="email">Email</Label>,
}

export const WithInput: Story = {
  render: () => {
    const id = React.useId()
    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor={id}>Email</Label>
        <Input id={id} placeholder="jane@example.com" type="email" />
      </div>
    )
  },
}

export const Disabled: Story = {
  render: () => {
    const id = React.useId()
    return (
      <div className="flex flex-col gap-2">
        <Input className="peer order-2" disabled id={id} placeholder="jane@example.com" />
        <Label className="order-1" htmlFor={id}>
          Email
        </Label>
      </div>
    )
  },
}
