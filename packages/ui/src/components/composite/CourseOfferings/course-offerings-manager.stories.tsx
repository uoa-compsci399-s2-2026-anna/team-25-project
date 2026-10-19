import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Button } from "../../ui/Button/button"
import { CourseOfferingsManager, type CourseOfferingsManagerItem } from "./course-offerings-manager"

// Newest first, as the course page lists them, with a draft for next year on top.
const items: CourseOfferingsManagerItem[] = [
  { id: 5, period: "Semester 2 2027", status: "draft", detail: "Capstone Project" },
  {
    id: 4,
    period: "Semester 1 2027",
    status: "published",
    detail: "1 Mar 2027 - 25 Jun 2027",
  },
  {
    id: 3,
    period: "Semester 2 2026",
    status: "published",
    detail: "20 Jul 2026 - 6 Nov 2026",
  },
  { id: 6, period: "Unscheduled", status: "draft", detail: "Capstone: Software" },
]

const meta: Meta<typeof CourseOfferingsManager> = {
  title: "composite/CourseOfferingsManager",
  component: CourseOfferingsManager,
  args: {
    courseCode: "COMPSCI 399",
    items,
    onAdd: () => {},
    onOpen: () => {},
    trigger: (
      <Button borderColor="charcoal" type="button" variant="button-transparent">
        Manage offerings
      </Button>
    ),
  },
}

export default meta
type Story = StoryObj<typeof CourseOfferingsManager>

export const Default: Story = {}

export const Open: Story = { args: { open: true } }

// A course's first offering, before anything has been added after it.
export const SingleOffering: Story = {
  args: { items: [items[2]], open: true },
}
