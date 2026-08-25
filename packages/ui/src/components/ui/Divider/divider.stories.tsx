import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Separator } from "./divider"

const meta: Meta<typeof Separator> = {
  title: "ui/Divider",
  component: Separator,
  args: {
    orientation: "horizontal",
  },
  argTypes: {
    orientation: {
      control: { type: "select" },
      options: ["horizontal", "vertical"],
    },
  },
}

export default meta
export type Story = StoryObj<typeof Separator>

export const Vertical: Story = {
  render: (_args) => (
    <div className="flex flex-col items-start gap-2">
      <p>Poposals Stats</p>
      <div>
        <div className="flex flex-row gap-3">
          <span className="flex w-[20%] flex-col text-xs">
            <span className="text-xl">27</span>
            Active proposals seeking collaborators
          </span>
          <Separator orientation="vertical" />
          <span className="flex w-[20%] flex-col text-xs">
            <span className="text-xl">6</span>
            Posted in the last 30 days
          </span>
          <Separator orientation="vertical" />
          <span className="flex w-[20%] flex-col text-xs">
            <span className="text-xl">8</span>
            Universities represented
          </span>
        </div>
      </div>
    </div>
  ),
}

export const Horizontal: Story = {
  render: (_args) => (
    <div className="flex flex-col items-center gap-2">
      <span>Content above the divider</span>
      <Separator orientation="horizontal" />
      <span>Content below the divider</span>
    </div>
  ),
}
