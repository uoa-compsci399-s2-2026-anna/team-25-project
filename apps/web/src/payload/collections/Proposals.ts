import {
  ProposalEthicsStatus,
  ProposalEthicsStatusLabels,
  ProposalStatus,
  ProposalStatusLabels,
  ProposalTagLabels,
  ProposalTimeframeEndPeriodLabels,
  ProposalTimeframeStartPeriodLabels,
} from "@repo/shared/enums/proposals"
import { toSelectOptions } from "@repo/shared/utils/select-options"
import type { CollectionConfig } from "payload"
import { Slugs } from "@/lib/payload/slugs"
import { isAdmin, isSignedIn } from "../access"
import { isAdminOrAuthors } from "../access/Proposals"
import {
  defaultProposalAuthor,
  generateProposalSlug,
  revalidateDeletedProposal,
  revalidateProposals,
  setProposalClosedAt,
} from "../hooks/Proposals"
import { validateProposalEndPeriod, validateProposalEndYear } from "../validation/Proposals"

export const Proposals: CollectionConfig = {
  slug: Slugs.Collections.PROPOSALS,
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "author", "status", "createdAt"],
  },
  access: {
    read: isSignedIn,
    create: isSignedIn,
    update: isAdminOrAuthors,
    delete: isAdmin,
  },
  hooks: {
    afterChange: [revalidateProposals],
    afterDelete: [revalidateDeletedProposal],
  },
  fields: [
    {
      name: "author",
      type: "relationship",
      relationTo: Slugs.Collections.MEMBERS,
      hasMany: true,
      required: true,
      hooks: {
        beforeChange: [defaultProposalAuthor],
      },
    },
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "proposalSlug",
      type: "text",
      admin: { position: "sidebar", readOnly: true },
      hooks: {
        beforeValidate: [generateProposalSlug],
      },
    },
    {
      // Read-only mirror of every author's institution. `author` is hasMany, so
      // Payload collects one entry per author; hasMany has to be set here too
      // because Payload only infers it for text, number and select virtuals.
      // Nothing is stored, so `required` would be unenforceable — the value is
      // guaranteed instead by institution being required on Members.
      name: "institutions",
      type: "relationship",
      relationTo: Slugs.Collections.INSTITUTIONS,
      hasMany: true,
      virtual: "author.institution",
    },
    {
      name: "summary",
      type: "textarea",
      maxLength: 500,
      required: true,
      admin: {
        description: "Plain text. Used for cards, search results and previews.",
      },
    },
    {
      name: "body",
      type: "richText",
      required: true,
      admin: {
        description: "The full proposal. Authors structure this however they like.",
      },
    },
    {
      name: "timeframe",
      type: "group",
      fields: [
        {
          type: "row",
          fields: [
            { name: "startYear", type: "number", required: true, min: 2000, max: 2100 },
            {
              name: "startPeriod",
              type: "select",
              required: true,
              options: toSelectOptions(ProposalTimeframeStartPeriodLabels),
            },
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "endYear",
              type: "number",
              min: 2000,
              max: 2100,
              validate: validateProposalEndYear,
            },
            {
              name: "endPeriod",
              type: "select",
              options: toSelectOptions(ProposalTimeframeEndPeriodLabels),
              validate: validateProposalEndPeriod,
            },
          ],
        },
      ],
    },
    {
      name: "outputTarget",
      type: "text",
      admin: {
        description: "What the collaboration aims to produce, e.g. ACE 2027 paper",
      },
    },
    {
      name: "ethics",
      type: "select",
      required: true,
      defaultValue: ProposalEthicsStatus.UNKNOWN,
      options: toSelectOptions(ProposalEthicsStatusLabels),
    },
    {
      name: "tags",
      type: "select",
      hasMany: true,
      options: toSelectOptions(ProposalTagLabels),
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: ProposalStatus.ACTIVE,
      admin: { position: "sidebar" },
      options: toSelectOptions(ProposalStatusLabels),
    },
    {
      name: "closedAt",
      type: "date",
      admin: { position: "sidebar", readOnly: true },
      hooks: {
        beforeChange: [setProposalClosedAt],
      },
    },
  ],
}
