import { RichText } from "@payloadcms/richtext-lexical/react"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
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

type Data = Parameters<typeof RichText>[0]["data"]

const textNode = (value: string) => ({
  detail: 0,
  format: 0,
  mode: "normal",
  style: "",
  text: value,
  type: "text",
  version: 1,
})

// One paragraph with the given inline nodes.
const inline = (...children: unknown[]) =>
  ({
    root: {
      ...element,
      children: [{ ...element, children, type: "paragraph" }],
      type: "root",
    },
  }) as unknown as Data

const linkNode = (fields: Record<string, unknown>, type = "link") => ({
  ...element,
  children: [textNode("Click")],
  fields,
  type,
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
} as unknown as Data

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

  it.each([
    ["https", "https://example.com/"],
    ["http", "http://example.com/"],
    ["mailto", "mailto:someone@example.com"],
  ])("keeps a %s link", (_, url) => {
    render(<RichText converters={richTextConverters} data={inline(linkNode({ url }))} />)
    expect(screen.getByRole("link", { name: "Click" })).toHaveAttribute("href", url)
  })

  it("opens a new-tab link safely", () => {
    const node = linkNode({ newTab: true, url: "https://example.com/" }, "autolink")
    render(<RichText converters={richTextConverters} data={inline(node)} />)

    const link = screen.getByRole("link", { name: "Click" })
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
  })

  it.each([
    ["a javascript: URL", { url: "javascript:alert(1)" }],
    ["a data: URL", { url: "data:text/html,hi" }],
    ["a relative URL", { url: "/admin" }],
    ["an internal link", { linkType: "internal", url: "https://example.com/" }],
    ["no fields", undefined],
  ])("renders a link with %s as plain text", (_, fields) => {
    render(<RichText converters={richTextConverters} data={inline(linkNode(fields as never))} />)

    expect(screen.getByText("Click")).toBeInTheDocument()
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  it.each([
    ["a file", { filename: "evil.pdf", mimeType: "application/pdf" }],
    ["an image", { alt: "Evil", mimeType: "image/png" }],
  ])("renders nothing for an upload of %s", (_, doc) => {
    const upload = {
      fields: {},
      relationTo: "media",
      type: "upload",
      value: { id: "1", url: "javascript:alert(1)", ...doc },
      version: 3,
    }
    const { container } = render(
      <RichText converters={richTextConverters} data={inline(textNode("Before"), upload)} />,
    )

    expect(screen.getByText("Before")).toBeInTheDocument()
    expect(container.querySelector("a, img, picture")).toBeNull()
  })

  it("renders nothing for a node with no converter", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    const block = { fields: {}, type: "block", version: 2 }
    const { container } = render(
      <RichText converters={richTextConverters} data={inline(textNode("Before"), block)} />,
    )

    expect(screen.getByText("Before")).toBeInTheDocument()
    expect(container).not.toHaveTextContent("unknown node")
    expect(consoleError).toHaveBeenCalledWith(
      "RichTextContent: no converter for node type",
      "block",
    )
    consoleError.mockRestore()
  })

  it("renders a table cell with no children as empty", () => {
    const { children: _, ...emptyCell } = cell("")
    const broken = {
      root: {
        ...element,
        children: [
          {
            ...element,
            children: [{ ...element, children: [emptyCell, cell("Kept")], type: "tablerow" }],
            type: "table",
          },
        ],
        type: "root",
      },
    } as unknown as Data
    render(<RichText converters={richTextConverters} data={broken} />)

    expect(screen.getAllByRole("cell")).toHaveLength(2)
    expect(screen.getByRole("cell", { name: "Kept" })).toBeInTheDocument()
  })
})
