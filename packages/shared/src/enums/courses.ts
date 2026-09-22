export const CourseDeliveryFormat = {
  IN_PERSON: "inPerson",
  ONLINE: "online",
  HYBRID: "hybrid",
} as const

export type CourseDeliveryFormat = (typeof CourseDeliveryFormat)[keyof typeof CourseDeliveryFormat]

export const CourseDeliveryFormatLabels: Record<CourseDeliveryFormat, string> = {
  [CourseDeliveryFormat.IN_PERSON]: "In person",
  [CourseDeliveryFormat.ONLINE]: "Online",
  [CourseDeliveryFormat.HYBRID]: "Hybrid",
} as const
