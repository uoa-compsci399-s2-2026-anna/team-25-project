import { Skeleton, Ticker } from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import { getInstitutionsWithLogosCached } from "@/features/institutions/institutions.queries"

const MIN_INSTITUTIONS_TO_ANIMATE = 3

// Shared between the real ticker and its skeleton so they can't drift out of sync -
// they must match exactly or swapping one for the other shifts the page layout.
// Deliberately left outside PageContainer in page.tsx so this stays full-bleed.
const BAR_CLASSNAME = "bg-muted py-3"

export const InstitutionsTicker = async () => {
  const institutions = await getInstitutionsWithLogosCached()
  if (institutions.length === 0) return null

  const animate = institutions.length >= MIN_INSTITUTIONS_TO_ANIMATE

  return (
    <>
      {/* The marquee below is decorative (and duplicates each logo for a seamless
          loop) - this is the one non-repeated, accessible source of the list. */}
      <span className="sr-only">
        Our partner institutions: {institutions.map((institution) => institution.name).join(", ")}
      </span>
      <Ticker
        aria-hidden="true"
        autoFill={animate}
        className={cn(
          "flex w-full items-center",
          BAR_CLASSNAME,
          // react-fast-marquee defaults to left-aligned, so i recenter when there's not enough to scroll
          !animate && "[&_.rfm-marquee]:justify-center",
        )}
        gradientColor="var(--color-muted)"
        gradientWidth={120}
        play={animate}
      >
        {institutions.map((institution) => (
          // biome-ignore lint/performance/noImgElement: needs images.remotePatterns for the S3 bucket hostname first - revisit once S3 is working
          <img
            alt=""
            className="mx-6 h-14 w-auto shrink-0 object-contain lg:mx-24"
            height={institution.logo.height ?? undefined}
            key={institution.id}
            src={institution.logo.url}
            width={institution.logo.width ?? undefined}
          />
        ))}
      </Ticker>
    </>
  )
}

const skeletonPills = Array.from({ length: 8 }, (_, index) => index)

export const InstitutionsTickerSkeleton = () => (
  <div className={cn("flex w-full items-center justify-center gap-6", BAR_CLASSNAME)}>
    {skeletonPills.map((pill) => (
      <Skeleton className="h-8 w-20 shrink-0 rounded-full bg-foreground/15" key={pill} />
    ))}
  </div>
)
