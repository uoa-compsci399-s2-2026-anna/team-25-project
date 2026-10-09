import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"
import { MenuToggleIcon } from "./menu-toggle-icon"

const meta: Meta<typeof MenuToggleIcon> = {
  title: "ui/MenuToggleIcon",
  component: MenuToggleIcon,
  args: {
    open: false,
  },
}

export default meta
type Story = StoryObj<typeof MenuToggleIcon>

export const Interactive: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    return (
      <button
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="cursor-pointer p-2 text-brand-charcoal"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <MenuToggleIcon open={open} />
      </button>
    )
  },
}

export const Closed: Story = {}

export const Open: Story = {
  args: { open: true },
}
