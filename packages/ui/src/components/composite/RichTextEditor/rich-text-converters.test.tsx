import { RichText } from "@payloadcms/richtext-lexical/react"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { richTextConverters } from "./rich-text-converters"

const element = { direction: "ltr", format: "", indent: 0, version: 1 }

const cell = (value: string, extra: Record<string, unknown> = {}) => ({
  ...element,
  children: [
    {
      ...element,
      children: [
        { detail: 0, format: 0, mode: "normal", style: "", text: value, type: "text", version: 1 },
      ],
      type: "paragraph",
    },
  ],
  colSpan: 1,
  headerState: 0,
  rowSpan: 1,
  type: "tablecell",
  ...extra,
})

const data = {
  root: {
    ...element,
    children: [
      {
        ...element,
        children: [
          {
            ...element,
            children: [cell("Wide", { colSpan: 2, headerState: 1 })],
            type: "tablerow",
          },
          { ...element, children: [cell("C", { rowSpan: 2 }), cell("D")], type: "tablerow" },
        ],
        type: "table",
      },
    ],
    type: "root",
  },
} as unknown as Parameters<typeof RichText>[0]["data"]

describe("richTextConverters", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders header and body cells without Payload's inline styles", () => {
    render(<RichText converters={richTextConverters} data={data} />)

    const header = screen.getByRole("columnheader", { name: "Wide" })
    expect(header.tagName).toBe("TH")
    expect(header).toHaveAttribute("colspan", "2")
    expect(header).not.toHaveAttribute("style")

    const body = screen.getByRole("cell", { name: "C" })
    expect(body.tagName).toBe("TD")
    expect(body).toHaveAttribute("rowspan", "2")
    expect(body).not.toHaveAttribute("style")
    expect(screen.getByRole("cell", { name: "D" })).not.toHaveAttribute("colspan")
  })

  it("wraps the table so wide tables scroll sideways", () => {
    render(<RichText converters={richTextConverters} data={data} />)

    const table = screen.getByRole("table")
    expect(table).not.toHaveAttribute("style")
    expect(table.parentElement).toHaveClass("overflow-x-auto")
  })
})
