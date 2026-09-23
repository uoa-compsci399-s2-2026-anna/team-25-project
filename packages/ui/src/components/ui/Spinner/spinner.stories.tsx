import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Spinner } from "./spinner"

const meta: Meta<typeof Spinner> = {
  title: "ui/Spinner",
  component: Spinner,
  args: {
    size: "default",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "default", "lg"],
    },
  },
}

export default meta
type Story = StoryObj<typeof Spinner>

export const Default: Story = {}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Spinner size="sm" />
      <Spinner size="default" />
      <Spinner size="lg" />
    </div>
  ),
}

export const InButton: Story = {
  render: () => (
    <button
      className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-primary-foreground text-sm disabled:opacity-50"
      disabled
      type="button"
    >
      <Spinner className="text-primary-foreground" />
      Loading...
    </button>
  ),
}
