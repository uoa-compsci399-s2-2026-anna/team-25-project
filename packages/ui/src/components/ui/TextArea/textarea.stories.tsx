import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Textarea } from "./textarea"

const meta: Meta<typeof Textarea> = {
  title: "UI/Textarea",
  component: Textarea,
}

export default meta
type Story = StoryObj<typeof Textarea>

export const Primary: Story = {
  render: () => (
    <div className="w-1/2">
      <Textarea placeholder="Enter your text here..." />
    </div>
  ),
}

export const SingleLine: Story = {
  render: () => (
    <div>
      <Textarea className="min-h-9" placeholder="Single line..." rows={1} />
    </div>
  ),
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
