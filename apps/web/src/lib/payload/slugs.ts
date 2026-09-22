export const Slugs = {
  Collections: {
    ADMIN: "admin",
    MEMBERS: "members",
    MEDIA: "media",
    INSTITUTIONS: "institutions",
    PROPOSALS: "proposals",
    COURSES: "courses",
    COURSE_VERSIONS: "courseVersions",
  },
} as const

export type CollectionSlug = (typeof Slugs.Collections)[keyof typeof Slugs.Collections]
