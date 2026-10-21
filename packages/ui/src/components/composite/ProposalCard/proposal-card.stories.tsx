import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ProposalCard, ProposalCardSkeleton } from "./proposal-card"

const meta: Meta<typeof ProposalCard> = {
  title: "composite/ProposalCard",
  component: ProposalCard,
  args: {
    authors: [{ institution: "University of Example", name: "Dr Anna Tui" }],
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
  // Roughly the listing's column width. Decorators nest rather than replace, so
  // a story needing the whole canvas opts out here instead of wrapping out.
  decorators: [
    (Story, context) => (
      <div className={context.parameters.fullWidth ? "w-full" : "w-full max-w-208"}>
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
    authors: [
      {
        avatarSrc: "https://github.com/shadcn.png",
        institution: "University of Example",
        name: "Dr Anna Tui",
      },
    ],
  },
}

export const WithAuthorLink: Story = {
  args: {
    authors: [
      {
        href: "/members/1",
        institution: "University of Example",
        name: "Dr Anna Tui",
      },
    ],
  },
}

/** Every author is listed; a byline too long for the card fades out instead of wrapping. */
export const ManyAuthors: Story = {
  args: {
    authors: [
      { href: "/members/1", institution: "University of Example", name: "Dr Anna Tui" },
      { href: "/members/2", institution: "Victoria University", name: "Ben Lee" },
      { href: "/members/3", institution: "University of Auckland", name: "Cara Diaz" },
      { href: "/members/4", institution: "University of Example", name: "Dr Hemi Walker" },
      { href: "/members/5", institution: "Monash University", name: "Priya Natarajan" },
    ],
  },
}

export const LongContent: Story = {
  args: {
    authors: [
      {
        institution: "Te Whare Wānanga o Waitaha | University of Canterbury",
        name: "Associate Professor Christopher Featherstonehaugh",
      },
    ],
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
  parameters: { fullWidth: true },
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
      <div className="w-88">
        <Story />
      </div>
    ),
  ],
}

/** Stands in for a card while the listing loads, next to a real one to compare sizes. */
export const Skeleton: Story = {
  parameters: { fullWidth: true },
  render: (args) => (
    <div className="grid gap-6 md:grid-cols-2">
      <ProposalCard {...args} />
      <ProposalCardSkeleton />
    </div>
  ),
}
