import { RichText } from "@payloadcms/richtext-lexical/react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import * as React from "react"
import { RichTextEditor, type RichTextValue } from "./rich-text-editor"

const text = (value: string, format = 0) => ({
  detail: 0,
  format,
  mode: "normal",
  style: "",
  text: value,
  type: "text",
  version: 1,
})

const element = { direction: "ltr", format: "", indent: 0, version: 1 } as const

const sample = {
  root: {
    ...element,
    type: "root",
    children: [
      { ...element, type: "heading", tag: "h2", children: [text("Project goals")] },
      {
        ...element,
        type: "paragraph",
        textFormat: 0,
        textStyle: "",
        children: [text("Build a "), text("working prototype", 1), text(" by week 8.")],
      },
      {
        ...element,
        type: "list",
        listType: "bullet",
        start: 1,
        tag: "ul",
        children: [
          { ...element, type: "listitem", value: 1, children: [text("User research")] },
          { ...element, type: "listitem", value: 2, children: [text("Prototype")] },
        ],
      },
    ],
  },
} as unknown as RichTextValue

const meta: Meta<typeof RichTextEditor> = {
  title: "composite/RichTextEditor",
  component: RichTextEditor,
  args: {
    placeholder: "Describe your proposal…",
  },
}

export default meta
type Story = StoryObj<typeof RichTextEditor>

export const Empty: Story = {}

export const WithContent: Story = {
  args: { defaultValue: sample },
}

export const Disabled: Story = {
  args: { defaultValue: sample, disabled: true },
}

export const Invalid: Story = {
  args: { "aria-invalid": true },
}

export const JsonPreview: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<RichTextValue | undefined>(sample)
    return (
      <div className="flex flex-col gap-4">
        <RichTextEditor {...args} defaultValue={sample} onChange={setValue} />
        <pre className="max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs">
          {JSON.stringify(value, null, 2)}
        </pre>
      </div>
    )
  },
}

export const RenderedPreview: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<RichTextValue>(sample)
    return (
      <div className="flex flex-col gap-4">
        <RichTextEditor {...args} defaultValue={sample} onChange={setValue} />
        <RichText className="rich-text text-sm" data={value} />
      </div>
    )
  },
}
