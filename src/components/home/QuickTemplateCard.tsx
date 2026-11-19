import Image from "next/image";
import Link from "next/link";
import type { HomeTemplateDto } from "@/lib/catalog";
import { PRODUCT_DISPLAY_IMAGES, PRODUCT_GRADIENTS } from "@/lib/home-data";
import { formatKRW } from "@/lib/pricing";

function templateImageSrc(tpl: HomeTemplateDto): string | null {
  return tpl.thumbnailUrl ?? null;
}

export function QuickTemplateCard({ tpl }: { tpl: HomeTemplateDto }) {
  const imageSrc = templateImageSrc(tpl);
  const isToms = tpl.productSlug.startsWith("toms-");

  return (
    <Link
      href={tpl.href}
      className="group block min-w-[min(100%,300px)] shrink-0 sm:min-w-0"
    >
      <div className="overflow-hidden rounded-2xl border border-zinc-100 transition hover:border-zinc-200 hover:shadow-md">
        <div
          className={`relative aspect-[5/4] overflow-hidden ${
            imageSrc ? "bg-zinc-100" : "bg-gradient-to-br from-zinc-100 to-zinc-200"
          }`}
        >
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={tpl.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 90vw, 420px"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              {isToms ? (
                <>
                  <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-600">
                    TOMS
                  </span>
                  <p className="mt-3 line-clamp-2 text-sm font-bold leading-snug text-zinc-800">
                    {tpl.productName}
                  </p>
                  <p className="mt-2 text-sm tabular-nums text-zinc-600">
                    {formatKRW(tpl.priceFrom)}~
                  </p>
                </>
              ) : (
                <div
                  className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${PRODUCT_GRADIENTS[tpl.productType]}`}
                >
                  {PRODUCT_DISPLAY_IMAGES[tpl.productType] ? (
                    <Image
                      src={PRODUCT_DISPLAY_IMAGES[tpl.productType]!}
                      alt={tpl.productName}
                      width={120}
                      height={120}
                      className="object-contain opacity-90"
                    />
                  ) : (
                    <span className="text-sm font-medium text-white/90">
                      {tpl.productName}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-1 pb-1 pt-4">
          <h3 className="text-[15px] font-bold leading-snug text-zinc-900 sm:text-base">
            {tpl.title}
          </h3>
          {tpl.description && (
            <p className="mt-2 text-sm leading-relaxed text-zinc-500 line-clamp-3">
              {tpl.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
