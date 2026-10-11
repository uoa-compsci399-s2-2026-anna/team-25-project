import type { Member, Publication } from "@repo/shared/payload-types"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { PublicationCard, PublicationCardSkeleton } from "./publication-card"

const timestamp = "2026-03-01T00:00:00.000Z"

const member = (id: number, firstName: string, lastName: string, avatarUrl?: string): Member => ({
  avatar: avatarUrl
    ? { alt: "", createdAt: timestamp, id, updatedAt: timestamp, url: avatarUrl }
    : null,
  collection: "members",
  createdAt: timestamp,
  email: `${firstName.toLowerCase()}@example.com`,
  firstName,
  id,
  institution: 1,
  lastName,
  position: "Lecturer",
  updatedAt: timestamp,
})

const publication: Publication = {
  abstract:
    "We follow four capstone cohorts over two years to see how peer assessment affects the marks of students in mixed-ability teams.",
  authors: [
    { member: member(1, "Anna", "Tui", "https://github.com/shadcn.png"), name: "Anna Tui" },
    { name: "Sam Lee" },
    { member: member(3, "Priya", "Shah"), name: "Priya Shah" },
  ],
  createdAt: timestamp,
  doi: "10.1145/3313831.3376518",
  id: 1,
  month: 3,
  tags: ["Assessment", "Capstone"],
  title: "Team assessment fairness in capstone cohorts",
  type: "article",
  updatedAt: timestamp,
  url: "https://example.com/papers/fairness",
  venue: "ACM Transactions on Computing Education",
  year: 2026,
}

const meta: Meta<typeof PublicationCard> = {
  title: "composite/PublicationCard",
  component: PublicationCard,
  args: {
    memberHref: (memberId) => `/members/${memberId}`,
    publication,
    size: "default",
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
type Story = StoryObj<typeof PublicationCard>

export const Primary: Story = {}

/** Only the required fields: no link, month, venue, DOI, abstract or tags. */
export const Minimal: Story = {
  args: {
    publication: {
      authors: [{ name: "Anna Tui" }],
      createdAt: timestamp,
      id: 2,
      title: publication.title,
      type: "article",
      updatedAt: timestamp,
      year: 2026,
    },
  },
}

export const WithoutLinkedAuthors: Story = {
  args: {
    publication: { ...publication, authors: [{ name: "Anna Tui" }, { name: "Sam Lee" }] },
  },
}

export const LongContent: Story = {
  args: {
    publication: {
      ...publication,
      abstract:
        "We follow eight capstone cohorts across four institutions over three years to see how peer assessment affects the marks of students in mixed-ability teams. We compare self, peer and supervisor marks, and look at how the gap changes as teams mature. We find that peer marks converge on supervisor marks after the first milestone, but that the gap stays open for students who join a team late.",
      authors: [
        { member: member(1, "Anna", "Tui"), name: "Anna Tui" },
        { name: "Sam Lee" },
        { member: member(3, "Priya", "Shah"), name: "Priya Shah" },
        { name: "Christopher Featherstonehaugh" },
        { member: member(5, "Mere", "Parata"), name: "Mere Parata" },
        { name: "Jordan Nguyen" },
      ],
      title:
        "Longitudinal study of team assessment fairness in capstone cohorts across eight institutions",
      venue: "Proceedings of the 58th ACM Technical Symposium on Computer Science Education",
    },
  },
}

/** How a listing lays them out: two columns that drop to one when narrow. */
export const PublicationGrid: Story = {
  parameters: { fullWidth: true },
  render: (args) => (
    <div className="grid gap-6 md:grid-cols-2">
      <PublicationCard {...args} />
      <PublicationCard {...args} publication={{ ...args.publication, type: "inproceedings" }} />
      <PublicationCard {...args} publication={{ ...args.publication, type: "phdthesis" }} />
      <PublicationCard {...args} publication={{ ...args.publication, type: "techreport" }} />
    </div>
  ),
}

/** Squeezed into a phone-width column, where the header and footer have to wrap. */
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
      <PublicationCard {...args} />
      <PublicationCardSkeleton />
    </div>
  ),
}
