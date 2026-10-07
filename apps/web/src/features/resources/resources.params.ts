import { notFound } from "next/navigation"

export type ResourceRouteParams = Promise<{ resourceId: string }>

export const parseResourceId = async (params: ResourceRouteParams) => {
  const { resourceId } = await params
  const id = Number(resourceId)
  if (!Number.isInteger(id) || id <= 0) notFound()
  return id
}
