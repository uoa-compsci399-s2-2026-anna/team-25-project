import path from "node:path"
import { fileURLToPath } from "node:url"
import { postgresAdapter } from "@payloadcms/db-postgres"
import { lexicalEditor } from "@payloadcms/richtext-lexical"
import { s3Storage } from "@payloadcms/storage-s3"
import type { Config } from "@repo/shared/payload-types"
import { buildConfig } from "payload"
import sharp from "sharp"
import { Admin } from "./payload/collections/Admin"
import { Courses } from "./payload/collections/Courses"
import { CourseVersions } from "./payload/collections/CourseVersions"
import { Institutions } from "./payload/collections/Institutions"
import { Media } from "./payload/collections/Media"
import { Members } from "./payload/collections/Members"
import { Proposals } from "./payload/collections/Proposals"
import { Publications } from "./payload/collections/Publications"
import { ResourceAttachments } from "./payload/collections/ResourceAttachments"
import { Resources } from "./payload/collections/Resources"
import { richTextFeatures } from "./payload/richText"

declare module "payload" {
  export interface GeneratedTypes extends Config {}
  export interface RequestContext {
    /** Lets completeProfile stamp registrationCompletedAt; see Members.ts. */
    completingRegistration?: boolean
    /** Skips cache revalidation hooks - set by seed.ts, which runs outside a request. */
    disableRevalidate?: boolean
  }
}

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Admin.slug, // members cannot reach /payload/admin
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
  ],
  editor: lexicalEditor({ features: richTextFeatures }),
  graphQL: {
    disable: true,
  },
  routes: {
    admin: "/payload/admin",
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
