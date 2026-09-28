// Stopgap for #96 (Create a Ticker component) - a plain static row for now.
// Swap this for the real Ticker once that component exists.
const placeholderPills = Array.from({ length: 8 }, (_, index) => index)

export const TickerPlaceholder = () => {
  return (
    <div
      className="flex w-full items-center justify-center gap-6 bg-muted px-8 py-6"
      data-testid="ticker-placeholder"
    >
      {placeholderPills.map((pill) => (
        <div className="h-8 w-20 shrink-0 rounded-full bg-foreground/15" key={pill} />
      ))}
    </div>
  )
}
