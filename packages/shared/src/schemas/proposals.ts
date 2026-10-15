import {
  ProposalEthicsStatus,
  ProposalStatus,
  ProposalTag,
  ProposalTimeframeEndPeriod,
  ProposalTimeframeStartPeriod,
} from "@repo/shared/enums/proposals"
import { z } from "zod"
import type { Proposal } from "../payload-types"
import { richTextHasText, richTextSchema } from "./shared"

const timeframeSchema = z
  .object({
    startYear: z.number().int().min(2000).max(2100),
    startPeriod: z.enum(ProposalTimeframeStartPeriod),
    endYear: z.number().int().min(2000).max(2100).optional(),
    endPeriod: z.enum(ProposalTimeframeEndPeriod).optional(),
  })
  .refine(
    (timeframe) => timeframe.endYear === undefined || timeframe.endYear >= timeframe.startYear,
    {
      error: "End year cannot be before the start year.",
      path: ["endYear"],
    },
  )
  .refine((timeframe) => timeframe.endPeriod === undefined || timeframe.endYear !== undefined, {
    error: "Set an end year before choosing an end period.",
    path: ["endPeriod"],
  })

export const createProposalSchema = z.object({
  author: z.array(z.number()).min(1, "At least one author is required"),
  title: z.string().min(1, "Title is required"),
  summary: z.string().min(1, "Summary is required").max(500),
  body: richTextSchema,
  timeframe: timeframeSchema,
  outputTarget: z.string().optional(),
  ethics: z.enum(ProposalEthicsStatus),
  tags: z.array(z.enum(ProposalTag)).optional(),
  status: z.enum(ProposalStatus).default(ProposalStatus.ACTIVE),
}) satisfies z.ZodType<Omit<Proposal, "id" | "createdAt" | "updatedAt">>

export type CreateProposalInput = z.infer<typeof createProposalSchema>

export const postProposalFormSchema = createProposalSchema
  .omit({ author: true, status: true })
  .extend({
    body: richTextSchema.refine((body) => richTextHasText(body.root), "Body is required"),
    outputTarget: z.string(),
  })

export type PostProposalFormInput = z.infer<typeof postProposalFormSchema>
