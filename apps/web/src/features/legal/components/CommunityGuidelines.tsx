import { RichTextContent } from "@/components/RichTextContent"
import { getCommunityGuidelinesCached } from "../legal.queries"

export const CommunityGuidelines = async () => {
  const { content } = await getCommunityGuidelinesCached()
  return <RichTextContent data={content} />
}
