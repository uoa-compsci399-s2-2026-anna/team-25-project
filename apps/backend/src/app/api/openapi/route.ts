import { NextResponse } from "next/server"

import { getApiDocs } from "@/lib/swagger"

export function GET(): NextResponse {
  return NextResponse.json(getApiDocs())
}
