import type { PayloadRequest } from "payload"
import { Slugs } from "@/lib/payload/slugs"

export const admin = (req: PayloadRequest) => req.user?.collection === Slugs.Collections.ADMIN

export const member = (req: PayloadRequest) => req.user?.collection === Slugs.Collections.MEMBERS
