"use client"

import { cn } from "@repo/ui/lib/utils"
import type * as React from "react"
import MarqueeImport from "react-fast-marquee"

// Some dependency pre-bundlers (like Vite's Rolldown-based optimizer) don't unwrap this package's CJS `exports.default`,
// giving us the raw module object instead of the component - fall back to `.default` when that happens.
const Marquee =
  typeof MarqueeImport === "function"
    ? MarqueeImport
    : ((MarqueeImport as { default: typeof MarqueeImport }).default ?? MarqueeImport)

type TickerProps = Omit<React.ComponentProps<typeof Marquee>, "className" | "style"> &
  React.ComponentProps<"div">

function Ticker({
  className,
  style,
  ref,
  autoFill = true,
  play,
  pauseOnHover = true,
  pauseOnClick,
  direction,
  speed = 40,
  delay,
  loop,
  gradient = true,
  gradientColor = "var(--color-background)",
  gradientWidth = 80,
  onFinish,
  onCycleComplete,
  onMount,
  children,
  ...divProps
}: TickerProps) {
  return (
    <div className={cn(className)} data-slot="ticker" ref={ref} style={style} {...divProps}>
      <Marquee
        autoFill={autoFill}
        delay={delay}
        direction={direction}
        gradient={gradient}
        gradientColor={gradientColor}
        gradientWidth={gradientWidth}
        loop={loop}
        onCycleComplete={onCycleComplete}
        onFinish={onFinish}
        onMount={onMount}
        pauseOnClick={pauseOnClick}
        pauseOnHover={pauseOnHover}
        play={play}
        speed={speed}
      >
        {children}
      </Marquee>
    </div>
  )
}

export type { TickerProps }
export { Ticker }
