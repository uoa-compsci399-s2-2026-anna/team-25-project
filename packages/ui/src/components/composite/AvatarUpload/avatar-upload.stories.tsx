import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { AvatarUpload } from "./avatar-upload"

const meta: Meta<typeof AvatarUpload> = {
  title: "composite/AvatarUpload",
  component: AvatarUpload,
}

export default meta
type Story = StoryObj<typeof AvatarUpload>

export const Primary: Story = {
  args: {
    fallback: "JD",
  },
}
