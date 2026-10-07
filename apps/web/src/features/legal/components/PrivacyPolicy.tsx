import { RichTextContent } from "@/components/RichTextContent"
import { getPrivacyPolicyCached } from "../legal.queries"

export const PrivacyPolicy = async () => {
  const { content } = await getPrivacyPolicyCached()
  return <RichTextContent data={content} />
}
