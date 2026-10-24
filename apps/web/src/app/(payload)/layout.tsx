/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from "@payload-config"
import "@repo/ui/brand.css"
import "@payloadcms/next/css"
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts"
import type { ServerFunctionClient } from "payload"
import type React from "react"
import { fontMono, satoshi } from "@/lib/fonts"

import { importMap } from "./payload/admin/importMap.js"
import "./custom.scss"

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async (args) => {
  "use server"
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {/* RootLayout owns <html>, so the font class names can't go there - point Payload's
        font variables at them instead. The rich text editor reads --font-serif, but the
        app renders rich text in Satoshi. */}
    <style>
      {`:root { --font-body: ${satoshi.style.fontFamily}; --font-serif: var(--font-body); --font-mono: ${fontMono.style.fontFamily}; }`}
    </style>
    {children}
  </RootLayout>
)

export default Layout
