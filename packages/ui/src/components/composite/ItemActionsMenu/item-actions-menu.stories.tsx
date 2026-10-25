import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ItemActionsMenu } from "./item-actions-menu"

const meta: Meta<typeof ItemActionsMenu> = {
  title: "composite/ItemActionsMenu",
  component: ItemActionsMenu,
  args: {
    itemLabel: "CS399",
    onDelete: () => {},
    onEdit: () => {},
  },
}

export default meta
type Story = StoryObj<typeof ItemActionsMenu>

export const Default: Story = {}

export const CustomDeleteMessage: Story = {
  args: {
    deleteConfirmMessage: "Delete this draft offering? This can't be undone.",
    itemLabel: "Semester 2 2026",
  },
}
