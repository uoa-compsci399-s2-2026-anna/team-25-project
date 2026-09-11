import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Badge } from "./badge"

// active and closed are excluded here since they render a dot indicator alongside text
// rather than a plain variant swap, so they are not compatible with the control dropdown
const variants = [
  "default",
  "secondary",
  "destructive",
  "outline",
  "ghost",
  "link",
  "salmon",
  "pink",
  "blue",
  "charcoal",
] as const

const meta: Meta<typeof Badge> = {
  title: "ui/Badge",
  component: Badge,
  args: {
    children: "Badge",
    variant: "default",
  },

  argTypes: {
    variant: {
      control: { type: "select" },
      options: variants,
    },
  },
}

export default meta
type Story = StoryObj<typeof Badge>

export const Primary: Story = {}

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-2">
      {variants.map((variant) => (
        <Badge key={variant} {...args} variant={variant}>
          {variant}
        </Badge>
      ))}
    </div>
  ),
}

export const Active: Story = {
  render: () => (
    <Badge variant="active">
      <span className="size-1.5 rounded-full bg-brand-rose" data-icon="inline-start" />
      Active
    </Badge>
  ),
}

export const Closed: Story = {
  render: () => (
    <Badge variant="closed">
      <span className="size-1.5 rounded-full bg-neutral-400" data-icon="inline-start" />
      Closed
    </Badge>
  ),
}
