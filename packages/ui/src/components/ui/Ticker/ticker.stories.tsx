import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Skeleton } from "../Skeleton/skeleton"
import { Ticker } from "./ticker"

const pills = Array.from({ length: 8 }, (_, index) => index)

const meta: Meta<typeof Ticker> = {
  title: "ui/Ticker",
  component: Ticker,
  argTypes: {
    direction: {
      control: "select",
      options: ["left", "right", "up", "down"],
    },
  },
}

export default meta
type Story = StoryObj<typeof Ticker>

export const Default: Story = {
  render: (args) => (
    <Ticker {...args} className="flex w-full items-center">
      {pills.map((pill) => (
        <Skeleton className="mx-3 h-8 w-20 shrink-0 rounded-full" key={pill} />
      ))}
    </Ticker>
  ),
}

export const PauseOnHoverDisabled: Story = {
  args: { pauseOnHover: false },
  render: Default.render,
}

export const NoGradient: Story = {
  args: { gradient: false },
  render: Default.render,
}
