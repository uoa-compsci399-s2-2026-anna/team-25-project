import { cva, type VariantProps } from "class-variance-authority"

/**
 * One `cva` per visible part. Only `container` declares the variants: it sets
 * `data-variant`, `data-density`, and `data-striped` on the `group/table`
 * wrapper, and the other parts react through `group-data-*` selectors. That
 * keeps the variant a single prop on `<Table>` instead of a prop every row and
 * cell has to forward, the same approach `TabsIndicator` uses.
 */
const tableVariants = {
  container: cva("group/table relative w-full overflow-x-auto", {
    variants: {
      variant: {
        default: "",
        // Borderless card: a warm fill and a large radius carry the edge, so the
        // header band clips to the corners and no outer stroke is drawn.
        card: "overflow-hidden rounded-3xl bg-brand-blush/30",
      },
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
      variant: "default",
      density: "comfortable",
      striped: false,
    },
  }),
  root: cva("w-full caption-bottom text-sm"),
  header: cva("[&_tr]:border-b group-data-[variant=card]/table:[&_tr]:border-b-0"),

  body: cva("[&_tr:last-child]:border-0"),
  footer: cva("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0"),
  // Card rows carry no divider: the header band and whitespace separate them.
  row: cva(
    "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted group-data-[striped=true]/table:even:bg-muted/30 group-data-[variant=card]/table:border-b-0 group-data-[variant=card]/table:hover:bg-brand-blush/40",
  ),
  head: cva(
    "h-10 whitespace-nowrap px-2 text-left align-middle font-medium text-foreground [&:has([role=checkbox])]:pr-0 group-data-[variant=card]/table:bg-brand-blush group-data-[variant=card]/table:px-6 group-data-[variant=card]/table:font-normal group-data-[variant=card]/table:text-muted-foreground/80 group-data-[variant=card]/table:uppercase group-data-[variant=card]/table:tracking-wide",
  ),
  cell: cva(
    "whitespace-nowrap px-2 align-middle [&:has([role=checkbox])]:pr-0 group-data-[density=comfortable]/table:py-4 group-data-[density=compact]/table:py-1.5 group-data-[variant=card]/table:px-6",
  ),
  caption: cva("mt-4 text-muted-foreground text-sm"),
}

type TableVariantProps = VariantProps<typeof tableVariants.container>

export { type TableVariantProps, tableVariants }
