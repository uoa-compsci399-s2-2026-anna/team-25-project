export const Slugs = {
  Collections: {
    ADMIN: "admin",
    MEMBERS: "members",
    MEDIA: "media",
  },
} as const

export type CollectionSlug = (typeof Slugs.Collections)[keyof typeof Slugs.Collections]
