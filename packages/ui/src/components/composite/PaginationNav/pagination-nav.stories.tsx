import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { PaginationNav } from "./pagination-nav"

const meta: Meta<typeof PaginationNav> = {
  title: "composite/PaginationNav",
  component: PaginationNav,
  args: {
    getHref: (page) => `?page=${page}`,
    page: 6,
    totalPages: 12,
  },
  argTypes: {
    page: { control: { min: 1, type: "number" } },
    totalPages: { control: { min: 1, type: "number" } },
  },
}

export default meta
type Story = StoryObj<typeof PaginationNav>

export const Primary: Story = {}

export const FirstPage: Story = { args: { page: 1 } }

export const LastPage: Story = { args: { page: 12 } }

export const FewPages: Story = { args: { page: 2, totalPages: 3 } }
