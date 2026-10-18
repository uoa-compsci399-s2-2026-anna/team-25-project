import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import * as React from "react"
import { CourseOfferingSwitcher } from "./course-offering-switcher"
import {
  CourseOfferingList,
  type CourseOfferingListItem,
  CourseOfferingNotice,
  CourseOfferingPeriodBadge,
} from "./course-offerings"

// Newest first, as a course page lists them.
const items: CourseOfferingListItem[] = [
  {
    id: 4,
    period: "Semester 1 2027",
    timing: "upcoming",
    href: "#",
    detail: "1 Mar 2027 - 25 Jun 2027",
  },
  {
    id: 3,
    period: "Semester 2 2026",
    timing: "inProgress",
    href: "#",
    detail: "20 Jul 2026 - 6 Nov 2026",
  },
  {
    id: 2,
    period: "Semester 1 2026",
    timing: "ended",
    href: "#",
    detail: "2 Mar 2026 - 26 Jun 2026",
  },
  {
    id: 1,
    period: "Semester 2 2025",
    timing: "ended",
    href: "#",
    detail: "Capstone: Software - 21 Jul 2025 - 7 Nov 2025",
  },
]

const meta: Meta<typeof CourseOfferingList> = {
  title: "composite/CourseOfferings",
  component: CourseOfferingList,
}

export default meta
type Story = StoryObj<typeof CourseOfferingList>

/** The sidebar list on a course page, with the in-progress offering selected. */
export const List: Story = {
  args: { items, selectedId: 3 },
  // As wide as the course page's sidebar. Kept to this story: a meta-level
  // decorator wraps every story, and squeezed the notices to this width too.
  decorators: [
    (Story) => (
      <div className="w-full max-w-80">
        <Story />
      </div>
    ),
  ],
}

/** Picking an offering moves the highlight, as navigating to it would. */
export const Switcher: Story = {
  decorators: [
    (Story) => (
      <div className="flex w-full justify-end">
        <Story />
      </div>
    ),
  ],
  render: () => {
    const [selectedId, setSelectedId] = React.useState(3)
    return (
      <CourseOfferingSwitcher onSelect={setSelectedId} options={items} selectedId={selectedId} />
    )
  },
}

/** The period badge in each of its timings. */
export const PeriodBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <CourseOfferingPeriodBadge period="Semester 1 2027" timing="upcoming" />
      <CourseOfferingPeriodBadge period="Semester 2 2026" timing="inProgress" />
      <CourseOfferingPeriodBadge period="Semester 2 2025" timing="ended" />
    </div>
  ),
}

/** Shown above an offering that isn't the course's current one. */
export const NoticeForAnEarlierOffering: Story = {
  // About as wide as the course page's main column.
  decorators: [
    (Story) => (
      <div className="w-full max-w-160">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <CourseOfferingNotice
      currentHref="#"
      currentPeriod="Semester 2 2026"
      period="Semester 2 2025"
      timing="ended"
    />
  ),
}

export const NoticeForAnUpcomingOffering: Story = {
  ...NoticeForAnEarlierOffering,
  render: () => (
    <CourseOfferingNotice
      currentHref="#"
      currentPeriod="Semester 2 2026"
      period="Semester 1 2027"
      timing="upcoming"
    />
  ),
}
