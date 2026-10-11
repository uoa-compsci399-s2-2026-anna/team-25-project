import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ResourceCard, ResourceCardSkeleton } from "./resource-card"

const meta: Meta<typeof ResourceCard> = {
  title: "composite/ResourceCard",
  component: ResourceCard,
  args: {
    course: "SE 101",
    href: "#",
    owner: { avatarSrc: "https://github.com/shadcn.png", href: "#", name: "Dr Anna Tui" },
    sharedAt: "2026-06-03T00:00:00.000Z",
    size: "default",
    summary:
      "Four-criterion rubric with moderation notes, used in a 180-student cohort since 2022.",
    title: "Individual contribution rubric for team projects",
  },
  argTypes: {
    size: {
      control: { type: "select" },
      options: ["default", "sm"],
    },
  },
  decorators: [
    (Story, context) => (
      <div className={context.parameters.fullWidth ? "w-full" : "w-full max-w-208"}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ResourceCard>

export const Primary: Story = {}

/** Only the required fields: no course, summary, photo or links. */
export const Minimal: Story = {
  args: {
    course: undefined,
    href: undefined,
    owner: { name: "Dr Anna Tui" },
    summary: undefined,
  },
}

/** A long summary clamps to two lines; the full description lives on the detail page. */
export const LongContent: Story = {
  args: {
    summary:
      "Four-criterion rubric with moderation notes, used in a 180-student cohort since 2022. Includes the marker guide, a worked example for each band, the moderation spreadsheet we use to reconcile peer and supervisor marks, and notes on how we handled teams where a member withdrew mid-semester.",
    title:
      "Individual contribution rubric for team projects, with moderation notes and worked examples for each band",
  },
}

/** How the resources page lays them out: one per row, full width. */
export const ResourceList: Story = {
  parameters: { fullWidth: true },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <ResourceCard {...args} />
      <ResourceCard {...args} course="COMPSCI 399" title="Industry partner agreement template" />
      <ResourceCard {...args} course={undefined} title="Team formation survey" />
    </div>
  ),
}

/** Squeezed into a phone-width column, where the byline truncates. */
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
    <div className="flex flex-col gap-4">
      <ResourceCard {...args} />
      <ResourceCardSkeleton />
    </div>
  ),
}
