import Image from "next/image";
import type { ProductType } from "@/types/builder";
import { PRODUCT_DISPLAY_IMAGES, PRODUCT_GRADIENTS } from "@/lib/home-data";

const BAG_COLORS: Record<string, string> = {
  mint: "#a8e6cf",
  cream: "#f5f0e6",
  navy: "#1e3a5f",
  pink: "#f8b4c4",
  sky: "#b8e0f6",
  white: "#ffffff",
};

const IMAGE_SIZES = {
  sm: { className: "h-20 w-20", px: 80 },
  md: { className: "h-28 w-28", px: 112 },
  lg: { className: "h-32 w-32", px: 128 },
} as const;

interface ProductVisualProps {
  productType: ProductType;
  color?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ProductVisual({
  productType,
  color = "mint",
  className = "",
  size = "md",
}: ProductVisualProps) {
  const imageSrc = PRODUCT_DISPLAY_IMAGES[productType];
  const { className: imageClass, px } = IMAGE_SIZES[size];

  if (imageSrc) {
    return (
      <div
        className={`relative flex items-center justify-center ${className}`}
      >
        <Image
          src={imageSrc}
          alt=""
          width={px}
          height={px}
          className={`${imageClass} object-contain drop-shadow-md`}
        />
      </div>
    );
  }

  const fill = BAG_COLORS[color] ?? BAG_COLORS.mint;
  const scale = size === "sm" ? "scale-75" : size === "lg" ? "scale-110" : "";

  if (productType === "pouch") {
    return (
      <div
        className={`relative flex items-center justify-center ${className}`}
      >
        <div
          className={`${scale} h-24 w-28 rounded-2xl shadow-lg`}
          style={{ backgroundColor: fill }}
        >
          <div className="absolute inset-x-3 top-3 h-1.5 rounded-full bg-black/10" />
          <div
            className="mx-auto mt-2 h-16 w-20 rounded-xl border border-black/5"
            style={{ backgroundColor: `${fill}dd` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center bg-gradient-to-br ${PRODUCT_GRADIENTS.ecobag} ${className}`}
    >
      <svg
        viewBox="0 0 120 150"
        className={`${scale} h-36 w-32 drop-shadow-xl`}
        aria-hidden
      >
        <path
          d="M25 50 L35 28 Q60 18 85 28 L95 50 Z"
          fill="none"
          stroke="#2d3748"
          strokeWidth="2.5"
        />
        <path
          d="M12 50 L108 50 L100 135 Q60 142 20 135 Z"
          fill={fill}
          stroke="#2d3748"
          strokeWidth="1.5"
        />
        <rect
          x="30"
          y="65"
          width="60"
          height="50"
          rx="3"
          fill="white"
          fillOpacity="0.4"
        />
      </svg>
    </div>
  );
}
