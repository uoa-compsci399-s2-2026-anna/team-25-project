import { z } from "zod"

import { registry } from "@/lib/openapi"

const HealthResponse = z
  .object({
    status: z.literal("ok"),
  })
  .meta({ id: "Health" })

registry.registerPath({
  method: "get",
  path: "/api/health",
  summary: "Service health status",
  responses: {
    200: {
      description: "Service is healthy",
      content: { "application/json": { schema: HealthResponse } },
    },
  },
})

export function GET() {
  return Response.json(HealthResponse.parse({ status: "ok" }))
}
