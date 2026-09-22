export const InstitutionCountry = {
  AU: "AU",
  NZ: "NZ",
} as const

export type InstitutionCountry = (typeof InstitutionCountry)[keyof typeof InstitutionCountry]

export const InstitutionCountryLabels: Record<InstitutionCountry, string> = {
  [InstitutionCountry.AU]: "Australia",
  [InstitutionCountry.NZ]: "New Zealand",
} as const
