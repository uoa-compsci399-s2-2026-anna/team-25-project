import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Separator } from "./separator"

const meta: Meta<typeof Separator> = {
  title: "ui/Separator",
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

export const Primary: Story = {
  render: (args) => (
    <div
      className={
        args.orientation === "vertical"
          ? "flex h-16 flex-row items-center gap-2"
          : "flex flex-col items-center gap-2"
      }
    >
      <span>Content</span>
      <Separator {...args} />
      <span>Content</span>
    </div>
  ),
}

export const Vertical: Story = {
  render: (_args) => (
    <div className="flex flex-col items-start gap-2">
      <p>Proposals Stats</p>
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
      <span>Content above the separator</span>
      <Separator orientation="horizontal" />
      <span>Content below the separator</span>
    </div>
  ),
}
