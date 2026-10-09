import type { Institution } from "../payload-types"

export const mockInstitution = (overrides: Partial<Institution> = {}): Institution => ({
  id: 1,
  name: "University of Auckland",
  country: "NZ",
  domains: [{ domain: "auckland.ac.nz" }],
  location: { latitude: -36.8523, longitude: 174.769 },
  logo: null,
  showLogo: true,
  updatedAt: "",
  createdAt: "",
  ...overrides,
})
