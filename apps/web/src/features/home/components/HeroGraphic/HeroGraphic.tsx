import { cn } from "@repo/ui/lib/utils"

// Hand-traced from the design's graduation cap. Colours are literal rather than
// brand tokens because the illustration's palette is its own - none of the
// brand colours match these warm taupes closely enough to substitute.
const colours = {
  base: "#414649",
  board: "#8A8071",
  button: "#E2D6BA",
  cord: "#B5945F",
  tassel: "#E0D3B4",
}

export const HeroGraphic = ({ className }: { className?: string }) => (
  <svg
    aria-hidden
    className={cn("h-auto w-full", className)}
    fill="none"
    role="presentation"
    viewBox="0 0 240 210"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Cap band. Its top is scooped to follow the board's underside, with the
        two upper corners rounded off rather than meeting the sides at a point. */}
    <path
      d="M58 136C58 126 62 120 70 120C80 122 100 134 118 134C136 134 156 122 166 120C174 120 178 126 178 136C182 152 176 168 160 176C148 182 88 182 76 176C60 168 54 152 58 136Z"
      fill={colours.base}
    />

    {/* Mortarboard. A diamond with its corners softened - the control points sit
        close to each corner, so it reads as a rhombus rather than an oval. */}
    <path
      d="M8 72C8 64 92 18 120 18C148 18 232 64 232 72C232 80 146 126 118 126C90 126 8 80 8 72Z"
      fill={colours.board}
    />

    {/* Tassel cord, drawn before the button so the button caps its end. */}
    <path
      d="M158 62C192 74 208 104 206 140"
      stroke={colours.cord}
      strokeLinecap="round"
      strokeWidth="6"
    />

    <ellipse cx="152" cy="62" fill={colours.button} rx="21" ry="15" />

    <circle cx="206" cy="148" fill={colours.tassel} r="9" />

    {/* Tassel. */}
    <path
      d="M206 156C216 156 222 168 222 180C222 192 215 200 206 200C197 200 190 192 190 180C190 168 196 156 206 156Z"
      fill={colours.tassel}
    />
  </svg>
)
