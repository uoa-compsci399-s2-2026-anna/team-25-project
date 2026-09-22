import {
  BlockquoteFeature,
  BoldFeature,
  EXPERIMENTAL_TableFeature,
  HeadingFeature,
  InlineToolbarFeature,
  ItalicFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnderlineFeature,
  UnorderedListFeature,
} from "@payloadcms/richtext-lexical"

// Only the features RichTextEditor (@repo/ui) can edit. It cannot load other nodes.
// richText.test.ts fails if a feature adds a node the editor does not support.
export const richTextFeatures = [
  ParagraphFeature(),
  HeadingFeature(),
  BlockquoteFeature(),
  UnorderedListFeature(),
  OrderedListFeature(),
  BoldFeature(),
  ItalicFeature(),
  UnderlineFeature(),
  EXPERIMENTAL_TableFeature(),
  InlineToolbarFeature(),
]
