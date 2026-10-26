export const Slugs = {
  Collections: {
    ADMIN: "admin",
    MEMBERS: "members",
    MEDIA: "media",
    INSTITUTIONS: "institutions",
    PROPOSALS: "proposals",
    COURSES: "courses",
    COURSE_VERSIONS: "courseVersions",
    PUBLICATIONS: "publications",
    RESOURCES: "resources",
    RESOURCE_ATTACHMENTS: "resourceAttachments",
    EMAIL_VERIFICATION_CODES: "emailVerificationCodes",
    RATE_LIMITS: "rateLimits",
  },
  Globals: {
    PRIVACY_POLICY: "privacy-policy",
    COMMUNITY_GUIDELINES: "community-guidelines",
  },
} as const

export type CollectionSlug = (typeof Slugs.Collections)[keyof typeof Slugs.Collections]
