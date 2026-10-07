import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { AttachmentList } from "./attachment-list"

const meta: Meta<typeof AttachmentList> = {
  title: "composite/AttachmentList",
  component: AttachmentList,
  args: {
    attachments: [
      {
        href: "#",
        id: 1,
        name: "individual-contribution-rubric.pdf",
        size: 2_516_582,
        type: "PDF",
      },
      {
        href: "#",
        id: 2,
        name: "moderation-notes.docx",
        size: 48_230,
        type: "Word document",
      },
      { href: "#", id: 3, name: "peer-marks-template.xlsx", size: 19_802, type: "Spreadsheet" },
    ],
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-208">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof AttachmentList>

export const Primary: Story = {}

export const Single: Story = {
  args: {
    attachments: [{ href: "#", id: 1, name: "survey.csv", size: 812, type: "CSV" }],
  },
}

/** A file stored without a type or size still gets a name and a download link. */
export const WithoutDetails: Story = {
  args: {
    attachments: [{ href: "#", id: 1, name: "notes.txt" }],
  },
}

/** A long file name truncates rather than pushing the download link out of the row. */
export const Narrow: Story = {
  args: {
    attachments: [
      {
        href: "#",
        id: 1,
        name: "individual-contribution-rubric-with-moderation-notes-2026-semester-two.pdf",
        size: 2_516_582,
        type: "PDF",
      },
    ],
  },
  decorators: [
    (Story) => (
      <div className="w-88">
        <Story />
      </div>
    ),
  ],
}
