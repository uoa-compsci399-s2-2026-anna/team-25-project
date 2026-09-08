import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ProposalCard } from "./proposal-card"

const meta: Meta<typeof ProposalCard> = {
  title: "composite/ProposalCard",
  component: ProposalCard,
  args: {
    author: { institution: "University of Example", name: "Dr Anna Tui" },
    postedAt: "2026-08-03T00:00:00.000Z",
    size: "default",
    status: "active",
    summary:
      "Seeking two co-investigators with access to multi-year peer-assessment data. Aiming for an ACE 2027 submission.",
    tags: [{ label: "Assessment" }, { label: "Multi-institution", variant: "salmon" }],
    title: "Longitudinal study of team assessment fairness in capstone cohorts",
  },
  argTypes: {
    size: {
      control: { type: "select" },
      options: ["default", "sm"],
    },
    status: {
      control: { type: "select" },
      options: ["active", "closed"],
    },
  },
  // The card takes its width from whatever lays it out, so the stories give it
  // roughly the column width the proposals listing does rather than pinning it.
  decorators: [
    (Story) => (
      <div className="w-full max-w-[52rem]">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ProposalCard>

export const Primary: Story = {}

export const Closed: Story = {
  args: {
    status: "closed",
  },
}

export const WithoutTags: Story = {
  args: {
    tags: undefined,
  },
}

export const WithAvatar: Story = {
  args: {
    author: {
      avatarSrc: "https://github.com/shadcn.png",
      institution: "University of Example",
      name: "Dr Anna Tui",
    },
  },
}

export const LongContent: Story = {
  args: {
    author: {
      institution: "Te Whare Wānanga o Waitaha | University of Canterbury",
      name: "Associate Professor Christopher Featherstonehaugh",
    },
    tags: [
      { label: "Assessment" },
      { label: "Multi-institution", variant: "salmon" },
      { label: "Generative AI" },
      { label: "Curriculum", variant: "salmon" },
    ],
    title:
      "Longitudinal study of team assessment fairness in capstone cohorts across eight institutions",
  },
}

/** How the proposals listing lays them out: two columns that drop to one when narrow. */
export const ProposalGrid: Story = {
  decorators: [
    (Story) => (
      <div className="w-full">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <div className="grid gap-6 md:grid-cols-2">
      <ProposalCard {...args} />
      <ProposalCard {...args} />
      <ProposalCard {...args} />
      <ProposalCard {...args} status="closed" />
    </div>
  ),
}

/** Squeezed into a phone-width column, where the header and byline have to wrap. */
export const Narrow: Story = {
  decorators: [
    (Story) => (
      <div className="w-[22rem]">
        <Story />
      </div>
    ),
  ],
}
