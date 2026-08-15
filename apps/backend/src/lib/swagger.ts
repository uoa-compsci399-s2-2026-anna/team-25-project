import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi"

import "@/app/api/health/route"
import { registry } from "@/lib/openapi"

export const getApiDocs = (): ReturnType<OpenApiGeneratorV3["generateDocument"]> =>
  new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Backend API",
      version: "1.0.0",
    },
  })
