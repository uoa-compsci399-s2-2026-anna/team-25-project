import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"
import { AttachmentPicker } from "./attachment-picker"

const file = (name: string, size: number) =>
  new File([new Uint8Array(size)], name, { type: "application/pdf" })

const meta: Meta<typeof AttachmentPicker> = {
  title: "composite/AttachmentPicker",
  component: AttachmentPicker,
  args: {
    accept: "application/pdf",
    files: [],
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-208">
        <Story />
      </div>
    ),
  ],
  // Holds the picked files the way a form would, so adding and removing work in the story.
  render: function Render(args) {
    const [files, setFiles] = useState(args.files)
    return <AttachmentPicker {...args} files={files} onFilesChange={setFiles} />
  },
}

export default meta
type Story = StoryObj<typeof AttachmentPicker>

export const Empty: Story = {}

export const WithFiles: Story = {
  args: {
    files: [
      file("individual-contribution-rubric.pdf", 2_516_582),
      file("moderation-notes.pdf", 48_230),
    ],
  },
}

export const Invalid: Story = {
  args: { invalid: true },
}

export const Disabled: Story = {
  args: { disabled: true, files: [file("moderation-notes.pdf", 48_230)] },
}

/** A long file name truncates rather than pushing the remove button out of the row. */
export const Narrow: Story = {
  args: {
    files: [
      file("individual-contribution-rubric-with-moderation-notes-2026-semester-two.pdf", 2_516_582),
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
