import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Heading } from "./heading"

const levels = ["h1", "h2", "h3", "h4", "h5", "h6"] as const

const meta: Meta<typeof Heading> = {
  title: "ui/Heading",
  component: Heading,
  args: {
    children: "Find collaborators for your next capstone project.",
    level: "h1",
  },

  argTypes: {
    level: {
      control: { type: "select" },
      options: levels,
    },
  },
}

export default meta
type Story = StoryObj<typeof Heading>

export const Primary: Story = {}

export const Scale: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {levels.map((level) => (
        <Heading key={level} level={level}>
          {level.toUpperCase()}: Find collaborators for your next capstone project.
        </Heading>
      ))}
    </div>
  ),
}
