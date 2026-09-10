import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Input } from "./input"

const types = ["text", "email", "password", "number", "file"] as const
const variants = ["pill", "box"] as const

const meta: Meta<typeof Input> = {
  title: "ui/Input",
  component: Input,
  args: {
    placeholder: "Enter text...",
    type: "text",
    variant: "box",
    disabled: false,
  },
  argTypes: {
    type: {
      control: { type: "select" },
      options: types,
    },
    variant: {
      control: { type: "select" },
      options: variants,
    },
    disabled: { control: { type: "boolean" } },
  },
}

export default meta
type Story = StoryObj<typeof Input>

export const Primary: Story = {}

export const Pill: Story = {
  args: {
    variant: "pill",
    placeholder: "Search name or interest...",
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    value: "Can't edit this",
  },
}

export const Invalid: Story = {
  args: {
    "aria-invalid": true,
    defaultValue: "invalid",
  },
}
