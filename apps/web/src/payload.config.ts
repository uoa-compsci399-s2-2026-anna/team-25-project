import path from "node:path"
import { fileURLToPath } from "node:url"
import { postgresAdapter } from "@payloadcms/db-postgres"
import { lexicalEditor } from "@payloadcms/richtext-lexical"
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
  collections: [Admin, Members, Institutions, Media, Proposals, Courses, CourseVersions],
  editor: lexicalEditor(),
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
  plugins: [],
})
