import Image from "next/image";
import Link from "next/link";
import { ProductVisual } from "./ProductVisual";
import type { HomeTemplateDto } from "@/lib/catalog";
import { PRODUCT_DISPLAY_IMAGES, PRODUCT_GRADIENTS } from "@/lib/home-data";

const PRODUCT_COLORS: Record<string, string> = {
  ecobag: "mint",
  "shopping-bag": "cream",
  pouch: "sky",
};

function formatCardTitle(tpl: HomeTemplateDto) {
  if (tpl.title.includes("만들기")) return tpl.title;
  return `${tpl.title}! ${tpl.productName} 만들기`;
}

function templateImageSrc(tpl: HomeTemplateDto): string | null {
  return tpl.thumbnailUrl ?? PRODUCT_DISPLAY_IMAGES[tpl.productType] ?? null;
}

export function QuickTemplateCard({ tpl }: { tpl: HomeTemplateDto }) {
  const cardTitle = formatCardTitle(tpl);
  const imageSrc = templateImageSrc(tpl);

  return (
    <Link
      href={`/products/${tpl.productSlug}`}
      className="group block min-w-[min(100%,300px)] shrink-0 sm:min-w-0"
    >
      <div className="overflow-hidden rounded-2xl">
        <div
          className={`relative aspect-[5/4] overflow-hidden ${
            imageSrc ? "bg-zinc-100" : `bg-gradient-to-br ${PRODUCT_GRADIENTS[tpl.productType]}`
          }`}
        >
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={cardTitle}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 90vw, 420px"
            />
          ) : (
            <div className="flex h-full items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <ProductVisual
                productType={tpl.productType}
                color={PRODUCT_COLORS[tpl.productSlug] ?? "mint"}
                size="lg"
              />
            </div>
          )}
        </div>

        <div className="pt-4">
          <h3 className="text-[15px] font-bold leading-snug text-zinc-900 sm:text-base">
            {cardTitle}
          </h3>
          {tpl.description && (
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              {tpl.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
