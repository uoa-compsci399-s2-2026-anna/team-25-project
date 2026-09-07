import { cva, type VariantProps } from "class-variance-authority"

/**
 * One `cva` per visible part. Only `container` declares the variants: it sets
 * `data-density` and `data-striped` on the `group/table` wrapper, and the other
 * parts react through `group-data-*` selectors. That keeps the variant a single
 * prop on `<Table>` instead of a prop every row and cell has to forward, the
 * same approach `TabsIndicator` uses.
 *
 * The base look is a borderless card: a warm fill and a large radius carry the
 * edge, so the header band clips to the corners and no outer stroke is drawn.
 */
const tableVariants = {
  container: cva("group/table relative w-full overflow-x-auto rounded-4xl bg-brand-blush/30", {
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
  }),
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
