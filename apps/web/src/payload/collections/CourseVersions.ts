import { CourseDeliveryFormat } from "@repo/shared/enums/courses"
import type { CollectionConfig } from "payload"
import { Slugs } from "@/lib/payload/slugs"
import { isAdmin } from "../access"

/**
 * One document per teaching period. Payload versions hold that period's drafts
 * and its earlier publications, so the document ID identifies the offering and
 * a native revision ID identifies one saved state of it.
 */
export const CourseVersions: CollectionConfig = {
  slug: Slugs.Collections.COURSE_VERSIONS,
  labels: { singular: "Course offering", plural: "Course offerings" },
  admin: { useAsTitle: "period", defaultColumns: ["course", "period", "startDate", "_status"] },
  versions: {
    drafts: {
      autosave: false,
    },
    maxPerDoc: 0,
  },
  access: {
    create: isAdmin,
    read: isAdmin,
    readVersions: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: "course",
      type: "relationship",
      relationTo: Slugs.Collections.COURSES,
      required: true,
      index: true,
    },
    { name: "period", type: "text", required: true },
    { name: "startDate", type: "date", required: true, index: true },
    { name: "endDate", type: "date", required: true },
    {
      name: "changeSummary",
      type: "textarea",
      admin: { description: "Required when publishing changes to a published offering." },
    },
    { name: "publishedAt", type: "date", admin: { readOnly: true } },
    {
      name: "publishedBy",
      type: "relationship",
      relationTo: [Slugs.Collections.MEMBERS, Slugs.Collections.ADMIN],
      admin: { readOnly: true },
    },
    { name: "name", type: "text" },
    { name: "programme", type: "text" },
    { name: "deliveryFormat", type: "select", options: Object.values(CourseDeliveryFormat) },
    { name: "projectType", type: "text" },
    { name: "learningOutcomes", type: "richText" },
    { name: "assessments", type: "richText" },
    {
      name: "teachingTeam",
      type: "array",
      fields: [
        { name: "member", type: "relationship", relationTo: Slugs.Collections.MEMBERS },
        { name: "role", type: "text" },
      ],
    },
    {
      // Historical display values, so an old revision keeps the code, institution
      // name and teaching-team names it was published with. A collapsible wrapper
      // carries the one heading for the whole block, so the group's own label is
      // off and the array below it is the only nested heading. Last in the list,
      // and closed by default, so the editable fields lead.
      type: "collapsible",
      label: "Published snapshot",
      admin: {
        initCollapsed: true,
        description:
          "Written at publication and read-only. Empty until this offering is published.",
      },
      fields: [
        {
          name: "displaySnapshot",
          type: "group",
          label: false,
          admin: { readOnly: true },
          fields: [
            {
              type: "row",
              fields: [
                { name: "courseCode", type: "text", admin: { width: "50%" } },
                { name: "institutionName", type: "text", admin: { width: "50%" } },
              ],
            },
            {
              name: "teachingTeam",
              type: "array",
              label: "Teaching Team (as published)",
              fields: [
                { name: "name", type: "text" },
                { name: "role", type: "text" },
              ],
            },
          ],
        },
      ],
    },
  ],
}
