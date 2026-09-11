export const CourseDeliveryFormat = {
  IN_PERSON: "inPerson",
  ONLINE: "online",
  HYBRID: "hybrid",
} as const

export type CourseDeliveryFormat = (typeof CourseDeliveryFormat)[keyof typeof CourseDeliveryFormat]
