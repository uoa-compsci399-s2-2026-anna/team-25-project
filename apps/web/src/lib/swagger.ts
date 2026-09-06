import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi"

import "@/app/(app)/api/health/route"
import { registry } from "@/lib/openapi"

export const getApiDocs = (): ReturnType<OpenApiGeneratorV3["generateDocument"]> =>
  new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Web API",
      version: "1.0.0",
    },
  })
