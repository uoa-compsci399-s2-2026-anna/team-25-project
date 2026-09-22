import { editorConfigFactory } from "@payloadcms/richtext-lexical"
import { SUPPORTED_NODE_TYPES } from "@repo/ui/components/composite/RichTextEditor/rich-text-nodes"
import { buildConfig } from "payload"
import { describe, expect, it } from "vitest"
import { richTextFeatures } from "./richText"

describe("richTextFeatures", () => {
  it("only enables nodes that RichTextEditor can load", async () => {
    const config = await buildConfig({ collections: [], secret: "test" } as never)
    const editorConfig = await editorConfigFactory.fromFeatures({
      config,
      features: richTextFeatures,
    })

    const nodeTypes = editorConfig.features.nodes.map(({ node }) =>
      "getType" in node ? node.getType() : node.replace.getType(),
    )

    expect(nodeTypes.length).toBeGreaterThan(0)
    expect(nodeTypes.filter((type) => !SUPPORTED_NODE_TYPES.has(type))).toEqual([])
  })
})
