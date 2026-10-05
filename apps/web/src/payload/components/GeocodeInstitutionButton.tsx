"use client"

import { Button, toast, useField, useFormFields } from "@payloadcms/ui"
import { useState } from "react"

type NominatimResult = { lat: string; lon: string; display_name: string }

/**
 * Rendered under the institution's GPS inputs (see Institutions.ts). Geocodes the
 * institution name via OpenStreetMap's Nominatim and fills latitude/longitude - the
 * admin still has to save. Nominatim allows ~1 req/s, fine for a manual click.
 */
export function GeocodeInstitutionButton() {
  const { setValue: setLatitude } = useField<number>({ path: "location.latitude" })
  const { setValue: setLongitude } = useField<number>({ path: "location.longitude" })
  const name = useFormFields(([fields]) => fields.name?.value as string | undefined)
  const country = useFormFields(([fields]) => fields.country?.value as string | undefined)
  const [loading, setLoading] = useState(false)

  async function lookUp() {
    if (!name?.trim()) {
      toast.error("Enter the institution name first.")
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({ q: name, format: "jsonv2", limit: "1" })
      if (country) params.set("countrycodes", country.toLowerCase()) // our enum is ISO alpha-2
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`)
      if (!res.ok) throw new Error(`Nominatim returned ${res.status}`)

      const [hit] = (await res.json()) as NominatimResult[]
      if (!hit) {
        toast.error(`No OpenStreetMap match for "${name}".`)
        return
      }

      // Nominatim returns the coordinates as strings
      setLatitude(Number(hit.lat))
      setLongitude(Number(hit.lon))
      toast.success(`Found: ${hit.display_name}`)
    } catch {
      toast.error("Location lookup failed - enter the coordinates manually.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button buttonStyle="secondary" disabled={loading} onClick={lookUp} size="small">
      {loading ? "Looking up…" : "Look up from name"}
    </Button>
  )
}
