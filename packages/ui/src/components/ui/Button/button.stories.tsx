import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Button } from "./button"

const variants = ["default", "outline", "secondary", "ghost", "destructive", "link"] as const

const sizes = ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"] as const

const meta: Meta<typeof Button> = {
  title: "ui/Button",
  component: Button,
  args: {
    children: "Button",
    variant: "default",
    size: "default",
    disabled: false,
  },
  argTypes: {
    variant: {
      control: { type: "select" },
      options: variants,
    },
    size: {
      control: { type: "select" },
      options: sizes,
    },
    disabled: { control: { type: "boolean" } },
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = {}

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-2">
      {variants.map((variant) => (
        <Button key={variant} {...args} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-2">
      {sizes.map((size) => (
        <Button key={size} {...args} size={size}>
          {size}
        </Button>
      ))}
    </div>
  ),
}
