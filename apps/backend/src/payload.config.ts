import path from "node:path"
import { fileURLToPath } from "node:url"
import { mongooseAdapter } from "@payloadcms/db-mongodb"
import { lexicalEditor } from "@payloadcms/richtext-lexical"
import type { Config } from "@repo/shared/payload-types"
import { buildConfig } from "payload"
import sharp from "sharp"
import { Media } from "./payload/collections/Media"
import { Users } from "./payload/collections/Users"

declare module "payload" {
  export interface GeneratedTypes extends Config {}
}

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media],
  editor: lexicalEditor(),
  routes: {
    admin: "/payload/admin",
    api: "/payload/api",
  },
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "../../../packages/shared/src/payload-types.ts"),
    declare: false,
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || "",
  }),
  sharp,
  plugins: [],
})
