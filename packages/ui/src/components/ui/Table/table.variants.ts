import { cva, type VariantProps } from "class-variance-authority"

/**
 * One `cva` per visible part. Only `container` declares the variants: it sets
 * `data-density` and `data-striped` on the `group/table` wrapper, and the other
 * parts react through `group-data-*` selectors.
 */
const tableVariants = {
  // The scroller. On a page that sets `--table-bleed` to its side padding, it
  // stretches out to the screen edges and pads back in by the same amount, so
  // the card starts in line with the page but scrolls all the way off the edge.
  // `--table-inset` pads back in by a different amount instead, e.g. to sit the
  // card closer to the screen edge than the rest of the page.
  //
  // The edge fades are a mask, not an overlay, so they fade the content into
  // whatever sits behind the table without matching the card or header colour.
  // `Table` sets `data-overflow-*` while columns are hidden past that edge.
  container: cva(
    [
      "group/table relative overflow-x-auto",
      "mx-[calc(var(--table-bleed,0px)*-1)] px-[var(--table-inset,var(--table-bleed,0px))]",
      "[--fade-end:0px] [--fade-start:0px] data-[overflow-end=true]:[--fade-end:3rem] data-[overflow-start=true]:[--fade-start:3rem]",
      "[mask-image:linear-gradient(to_right,transparent,#000_var(--fade-start),#000_calc(100%_-_var(--fade-end)),transparent)]",
    ],
    {
      variants: {
        density: {
          comfortable: "",
          compact: "",
        },
        striped: {
          false: "",
          true: "",
        },
      },
      defaultVariants: {
        density: "comfortable",
        striped: false,
      },
    },
  ),
  // Owns the card styling, so the rounded edge scrolls with the columns.
  card: cva("w-max min-w-full overflow-hidden rounded-4xl bg-brand-blush/30"),
  root: cva("w-full caption-bottom text-sm"),
  header: cva(""),
  body: cva(""),
  footer: cva("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0"),
  // Rows carry no divider: the header band and whitespace separate them.
  row: cva(
    "transition-colors hover:bg-brand-blush/40 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted group-data-[striped=true]/table:even:bg-muted/30",
  ),
  head: cva(
    "h-10 whitespace-nowrap bg-brand-blush px-6 text-left align-middle font-normal text-muted-foreground/80 uppercase tracking-wide [&:has([role=checkbox])]:pr-0",
  ),
  cell: cva(
    "whitespace-nowrap px-6 align-middle [&:has([role=checkbox])]:pr-0 group-data-[density=comfortable]/table:py-4 group-data-[density=compact]/table:py-1.5",
  ),
  caption: cva("mt-4 text-muted-foreground text-sm"),
}

type TableVariantProps = VariantProps<typeof tableVariants.container>

export { type TableVariantProps, tableVariants }
