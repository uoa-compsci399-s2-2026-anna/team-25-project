import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Eyebrow } from "./eyebrow"

const meta: Meta<typeof Eyebrow> = {
  title: "ui/Eyebrow",
  component: Eyebrow,
  args: {
    children: "Computing Capstone Community Australasia",
  },
}

export default meta
type Story = StoryObj<typeof Eyebrow>

export const Primary: Story = {}
