import { notFound } from "next/navigation"

export type MembersRouteParams = Promise<{ memberId: string }>

export const parseMemberId = async (params: MembersRouteParams) => {
  const { memberId } = await params
  const id = Number(memberId)
  if (!Number.isInteger(id) || id <= 0) notFound()
  return id
}
