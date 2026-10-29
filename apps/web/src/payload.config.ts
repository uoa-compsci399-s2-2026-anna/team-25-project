import path from "node:path"
import { fileURLToPath } from "node:url"
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2"
import { postgresAdapter } from "@payloadcms/db-postgres"
import { nodemailerAdapter } from "@payloadcms/email-nodemailer"
import { lexicalEditor } from "@payloadcms/richtext-lexical"
import { s3Storage } from "@payloadcms/storage-s3"
import type { Config } from "@repo/shared/payload-types"
import nodemailer from "nodemailer"
import { buildConfig } from "payload"
import sharp from "sharp"
import { Admin } from "./payload/collections/Admin"
import { Courses } from "./payload/collections/Courses"
import { CourseVersions } from "./payload/collections/CourseVersions"
import { EmailVerificationCodes } from "./payload/collections/EmailVerificationCodes"
import { Institutions } from "./payload/collections/Institutions"
import { Media } from "./payload/collections/Media"
import { Members } from "./payload/collections/Members"
import { Proposals } from "./payload/collections/Proposals"
import { Publications } from "./payload/collections/Publications"
import { RateLimits } from "./payload/collections/RateLimits"
import { ResourceAttachments } from "./payload/collections/ResourceAttachments"
import { Resources } from "./payload/collections/Resources"
import { CommunityGuidelines } from "./payload/globals/CommunityGuidelines"
import { PrivacyPolicy } from "./payload/globals/PrivacyPolicy"
import { richTextFeatures } from "./payload/richText"

declare module "payload" {
  export interface GeneratedTypes extends Config {}
  export interface RequestContext {
    /** Lets completeProfile stamp registrationCompletedAt; see Members.ts. */
    completingRegistration?: boolean
    /** Skips cache revalidation hooks - set by seed.ts, which runs outside a request. */
    disableRevalidate?: boolean
    /** Skips enforceInstitutionDomain - set by writes that never change the email or institution. */
    skipDomainCheck?: boolean
  }
}

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Admin.slug, // members cannot reach /admin
    theme: "light",
    components: {
      afterLogin: ["/payload/components/ReturnToSite#ReturnToSiteLoginLink"],
      afterNavLinks: ["/payload/components/ReturnToSite#ReturnToSiteNavLink"],
      graphics: {
        Logo: "/payload/components/AdminLogo#AdminLogo",
        Icon: "/payload/components/AdminIcon#AdminIcon",
      },
    },
    meta: {
      titleSuffix: " | CCCA Admin",
      // Payload sets its own icons, which override app/icon.svg and app/apple-icon.png.
      icons: [
        { rel: "icon", url: "/icon.svg", sizes: "any", type: "image/svg+xml" },
        { rel: "apple-touch-icon", url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      ],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Admin,
    Members,
    Institutions,
    Media,
    Proposals,
    Courses,
    CourseVersions,
    Publications,
    Resources,
    ResourceAttachments,
    EmailVerificationCodes,
    RateLimits,
  ],
  globals: [PrivacyPolicy, CommunityGuidelines],
  editor: lexicalEditor({ features: richTextFeatures }),
  graphQL: {
    disable: true,
  },
  routes: {
    admin: "/admin",
    api: "/payload/api",
  },
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "../../../packages/shared/src/payload-types.ts"),
    declare: false,
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || "",
    },
    migrationDir: path.resolve(dirname, "./payload/migrations"),
    push: false,
  }),
  // Unset, Payload falls back to logging each email's recipient and subject.
  email: process.env.SES_FROM_ADDRESS
    ? nodemailerAdapter({
        defaultFromAddress: process.env.SES_FROM_ADDRESS,
        defaultFromName: "CCCA",
        transport: nodemailer.createTransport({
          SES: {
            sesClient: new SESv2Client({ region: process.env.SES_REGION || undefined }),
            SendEmailCommand,
          },
        }),
      })
    : undefined,
  sharp,
  upload: {
    limits: { fileSize: 50 * 1024 * 1024 },
    // Without this an oversized file is cut off at the limit and saved truncated.
    abortOnLimit: true,
  },
  plugins: [
    s3Storage({
      enabled: Boolean(process.env.S3_BUCKET && process.env.S3_REGION),
      alwaysInsertFields: true,
      collections: {
        media: { prefix: "media" },
        resourceAttachments: { prefix: "resourceAttachments" },
      },
      bucket: process.env.S3_BUCKET ?? "",
      config: {
        region: process.env.S3_REGION ?? "",
      },
    }),
  ],
})
