import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { TextArea } from "./textarea"

const variants = ["pill", "box"] as const

const meta: Meta<typeof TextArea> = {
  title: "ui/Forms/TextArea",
  component: TextArea,
  args: {
    className: "",
    variant: "box",
  },
  argTypes: {
    className: {
      control: { type: "text" },
    },
    variant: {
      control: { type: "select" },
      options: variants,
    },
  },
}

export default meta
type Story = StoryObj<typeof TextArea>

export const Primary: Story = {
  render: (args) => (
    <div className="w-1/2">
      <TextArea {...args} placeholder="Enter your text here..." />
    </div>
  ),
}

export const SingleLine: Story = {
  args: {
    className: "min-h-9",
  },
  render: (args) => (
    <div>
      <TextArea {...args} placeholder="Single line..." rows={1} />
    </div>
  ),
}

export const Pill: Story = {
  args: {
    variant: "pill",
    placeholder: "A sentence or two on what you teach...",
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "Can't edit this",
  },
}

export const Invalid: Story = {
  args: {
    "aria-invalid": true,
    defaultValue: "Invalid input",
  },
}

export const WithMaxLength: Story = {
  args: {
    maxLength: 50,
    placeholder: "Max 50 characters...",
  },
}

export const ResizeNone: Story = {
  args: {
    className: "resize-none",
    placeholder: "Not resizable...",
  },
}
