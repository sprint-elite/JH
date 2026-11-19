/**
 * TOMS 품번별 전용 빌더·상품 목업 (public/mockups/*.png)
 * import-store-products.ts 마지막에 syncTomsProductMockups 호출
 */
import type { PrismaClient } from "@prisma/client";
import { tomsSlug } from "./toms-2026ss-catalog";

type PrintRect = { x: number; y: number; w: number; h: number };

export type TomsMockupSpec = {
  front: string;
  back: string;
  width: number;
  height: number;
  backWidth?: number;
  backHeight?: number;
  frontPrint: PrintRect;
  backPrint: PrintRect;
};

/** 품번 → 목업 파일 (파일 추가 시 여기만 확장) */
const PRINT_FRONT = { x: 0.28, y: 0.38, w: 0.44, h: 0.2 };
const PRINT_BACK = { x: 0.28, y: 0.36, w: 0.44, h: 0.22 };

/** 기타(에코백·캡·자켓) — 티셔츠용 인쇄 박스와 캔버스 비율이 맞지 않음 */
const PRINT_BAG_FRONT = { x: 0.24, y: 0.4, w: 0.52, h: 0.34 };
const PRINT_BAG_BACK = { x: 0.24, y: 0.38, w: 0.52, h: 0.36 };
const PRINT_CAP_FRONT = { x: 0.3, y: 0.34, w: 0.4, h: 0.26 };
const PRINT_CAP_BACK = { x: 0.36, y: 0.4, w: 0.28, h: 0.12 };
const PRINT_JACKET_FRONT = { x: 0.28, y: 0.34, w: 0.44, h: 0.28 };
const PRINT_JACKET_BACK = { x: 0.28, y: 0.3, w: 0.44, h: 0.34 };

export const TOMS_MOCKUP_SPECS: Record<string, TomsMockupSpec> = {
  "083-BBT": {
    front: "/mockups/083-BBT-front.png",
    back: "/mockups/083-BBT-back.png",
    width: 1122,
    height: 1402,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "085-CVT": {
    front: "/mockups/085-CVT-front.png",
    back: "/mockups/085-CVT-back.png",
    width: 1254,
    height: 1254,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "086-DMT": {
    front: "/mockups/086-DMT-front.png",
    back: "/mockups/086-DMT-back.png",
    width: 1841,
    height: 1600,
    backWidth: 1254,
    backHeight: 1254,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "087-OET": {
    front: "/mockups/087-OET-front.png",
    back: "/mockups/087-OET-back.png",
    width: 1254,
    height: 1254,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "102-CVL": {
    front: "/mockups/102-CVL-front.png",
    back: "/mockups/102-CVL-back.png",
    width: 1122,
    height: 1402,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "109-PCT": {
    front: "/mockups/109-PCT-front.png",
    back: "/mockups/109-PCT-back.png",
    width: 1122,
    height: 1402,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "110-CLL": {
    front: "/mockups/110-CLL-front.png",
    back: "/mockups/110-CLL-back.png",
    width: 1293,
    height: 1217,
    backWidth: 1122,
    backHeight: 1402,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "113-BCV": {
    front: "/mockups/113-BCV-front.png",
    back: "/mockups/113-BCV-back.png",
    width: 1122,
    height: 1402,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "148-HVT": {
    front: "/mockups/148-HVT-front.png",
    back: "/mockups/148-HVT-back.png",
    width: 1145,
    height: 1374,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "149-HVL": {
    front: "/mockups/149-HVL-front.png",
    back: "/mockups/149-HVL-back.png",
    width: 1272,
    height: 1236,
    backWidth: 1122,
    backHeight: 1402,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "300-ACT": {
    front: "/mockups/300-ACT-front.png",
    back: "/mockups/300-ACT-back.png",
    width: 1122,
    height: 1402,
    backWidth: 1200,
    backHeight: 1400,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "304-ALT": {
    front: "/mockups/304-ALT-front.png",
    back: "/mockups/304-ALT-back.png",
    width: 1122,
    height: 1402,
    backWidth: 1200,
    backHeight: 1400,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "350-AIT": {
    front: "/mockups/350-AIT-front.png",
    back: "/mockups/350-AIT-back.png",
    width: 1122,
    height: 1402,
    backWidth: 1200,
    backHeight: 1400,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "353-AIN": {
    front: "/mockups/353-AIN-front.png",
    back: "/mockups/353-AIN-back.png",
    width: 1122,
    height: 1402,
    backWidth: 1200,
    backHeight: 1400,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "321-ACR": {
    front: "/mockups/321-ACR-front.png",
    back: "/mockups/321-ACR-back.png",
    width: 1122,
    height: 1402,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "325-ACP": {
    front: "/mockups/325-ACP-front.png",
    back: "/mockups/325-ACP-back.png",
    width: 1122,
    height: 1402,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "338-AMZ": {
    front: "/mockups/338-AMZ-front.png",
    back: "/mockups/338-AMZ-back.png",
    width: 1122,
    height: 1402,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "302-ADP": {
    front: "/mockups/302-ADP-front.png",
    back: "/mockups/302-ADP-back.png",
    width: 1462,
    height: 1600,
    backWidth: 1400,
    backHeight: 1400,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "330-AVP": {
    front: "/mockups/330-AVP-front.png",
    back: "/mockups/330-AVP-back.png",
    width: 1480,
    height: 1600,
    backWidth: 1400,
    backHeight: 1400,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "313-ABN": {
    front: "/mockups/313-ABN-front.png",
    back: "/mockups/313-ABN-back.png",
    width: 1688,
    height: 1600,
    backWidth: 1400,
    backHeight: 1400,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "339-AYP": {
    front: "/mockups/339-AYP-front.png",
    back: "/mockups/339-AYP-back.png",
    width: 1619,
    height: 1600,
    backWidth: 1122,
    backHeight: 1402,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "141-NVP": {
    front: "/mockups/141-NVP-front.png",
    back: "/mockups/141-NVP-back.png",
    width: 1600,
    height: 1623,
    backWidth: 1122,
    backHeight: 1402,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "335-ALP": {
    front: "/mockups/335-ALP-front.png",
    back: "/mockups/335-ALP-back.png",
    width: 1600,
    height: 1683,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "210-NAC": {
    front: "/mockups/210-NAC-front.png",
    back: "/mockups/210-NAC-back.png",
    width: 1122,
    height: 1402,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "207-NAH": {
    front: "/mockups/207-NAH-front.png",
    back: "/mockups/207-NAH-back.png",
    width: 1122,
    height: 1402,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "208-NAZ": {
    front: "/mockups/208-NAZ-front.png",
    back: "/mockups/208-NAZ-back.png",
    width: 1122,
    height: 1402,
    backWidth: 1000,
    backHeight: 1200,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "271-BFC": {
    front: "/mockups/271-BFC-front.png",
    back: "/mockups/271-BFC-back.png",
    width: 1122,
    height: 1402,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "219-MLC": {
    front: "/mockups/219-MLC-front.png",
    back: "/mockups/219-MLC-back.png",
    width: 1254,
    height: 1254,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "216-MLH": {
    front: "/mockups/216-MLH-front.png",
    back: "/mockups/216-MLH-back.png",
    width: 1254,
    height: 1254,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "272-BFH": {
    front: "/mockups/272-BFH-front.png",
    back: "/mockups/272-BFH-back.png",
    width: 1254,
    height: 1254,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "273-BFZ": {
    front: "/mockups/273-BFZ-front.png",
    back: "/mockups/273-BFZ-back.png",
    width: 1254,
    height: 1254,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "217-MLZ": {
    front: "/mockups/217-MLZ-front.png",
    back: "/mockups/217-MLZ-back.png",
    width: 1600,
    height: 1927,
    backWidth: 1254,
    backHeight: 1254,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "218-MLP": {
    front: "/mockups/218-MLP-front.png",
    back: "/mockups/218-MLP-back.png",
    width: 856,
    height: 2048,
    backWidth: 1000,
    backHeight: 1250,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "220-MHP": {
    front: "/mockups/220-MHP-front.png",
    back: "/mockups/220-MHP-back.png",
    width: 1652,
    height: 1600,
    backWidth: 1000,
    backHeight: 1250,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "183-NSC": {
    front: "/mockups/183-NSC-front.png",
    back: "/mockups/183-NSC-back.png",
    width: 1785,
    height: 1600,
    backWidth: 1254,
    backHeight: 1254,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "188-NNH": {
    front: "/mockups/188-NNH-front.png",
    back: "/mockups/188-NNH-back.png",
    width: 1600,
    height: 1913,
    backWidth: 1122,
    backHeight: 1402,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "189-NNZ": {
    front: "/mockups/189-NNZ-front.png",
    back: "/mockups/189-NNZ-back.png",
    width: 1600,
    height: 1947,
    backWidth: 1254,
    backHeight: 1254,
    frontPrint: PRINT_FRONT,
    backPrint: PRINT_BACK,
  },
  "238-RFJ": {
    front: "/mockups/238-RFJ-front.png",
    back: "/mockups/238-RFJ-back.png",
    width: 1122,
    height: 1402,
    backWidth: 1200,
    backHeight: 1400,
    frontPrint: PRINT_JACKET_FRONT,
    backPrint: PRINT_JACKET_BACK,
  },
  "731-CCK": {
    front: "/mockups/731-CCK-front.png",
    back: "/mockups/731-CCK-back.png",
    width: 1254,
    height: 1254,
    backWidth: 1200,
    backHeight: 1400,
    frontPrint: PRINT_CAP_FRONT,
    backPrint: PRINT_CAP_BACK,
  },
  "778-TCC": {
    front: "/mockups/778-TCC-front.png",
    back: "/mockups/778-TCC-back.png",
    width: 1086,
    height: 1448,
    backWidth: 1200,
    backHeight: 1400,
    frontPrint: PRINT_BAG_FRONT,
    backPrint: PRINT_BAG_BACK,
  },
  "780-TWT": {
    front: "/mockups/780-TWT-front.png",
    back: "/mockups/780-TWT-back.png",
    width: 1086,
    height: 1448,
    backWidth: 1200,
    backHeight: 1400,
    frontPrint: PRINT_BAG_FRONT,
    backPrint: PRINT_BAG_BACK,
  },
};

/** 2분컷·썸네일용 앞면 목업 URL */
export function tomsMockupFrontUrl(code: string): string | null {
  return TOMS_MOCKUP_SPECS[code]?.front ?? null;
}

function faceRows(spec: TomsMockupSpec) {
  return [
    {
      side: "front",
      label: "앞면",
      imageUrl: spec.front,
      imageWidth: spec.width,
      imageHeight: spec.height,
      printX: spec.frontPrint.x,
      printY: spec.frontPrint.y,
      printW: spec.frontPrint.w,
      printH: spec.frontPrint.h,
      sortOrder: 0,
    },
    {
      side: "back",
      label: "뒷면",
      imageUrl: spec.back,
      imageWidth: spec.backWidth ?? spec.width,
      imageHeight: spec.backHeight ?? spec.height,
      printX: spec.backPrint.x,
      printY: spec.backPrint.y,
      printW: spec.backPrint.w,
      printH: spec.backPrint.h,
      sortOrder: 1,
    },
  ] as const;
}

async function upsertMockupsForProduct(
  prisma: PrismaClient,
  productId: string,
  spec: TomsMockupSpec,
) {
  const faces = faceRows(spec);
  for (const face of faces) {
    await prisma.productMockupFace.upsert({
      where: { productId_side: { productId, side: face.side } },
      update: {
        label: face.label,
        imageUrl: face.imageUrl,
        imageWidth: face.imageWidth,
        imageHeight: face.imageHeight,
        printX: face.printX,
        printY: face.printY,
        printW: face.printW,
        printH: face.printH,
        sortOrder: face.sortOrder,
      },
      create: { productId, ...face },
    });
  }
  await prisma.productMockupFace.deleteMany({
    where: {
      productId,
      side: { notIn: faces.map((f) => f.side) },
    },
  });
}

async function upsertGallery(
  prisma: PrismaClient,
  productId: string,
  spec: TomsMockupSpec,
) {
  await prisma.productImage.deleteMany({ where: { productId } });
  await prisma.productImage.createMany({
    data: [
      {
        productId,
        url: spec.front,
        alt: "앞면",
        sortOrder: 0,
        isPrimary: true,
      },
      {
        productId,
        url: spec.back,
        alt: "뒷면",
        sortOrder: 1,
        isPrimary: false,
      },
    ],
  });
}

export async function syncTomsProductMockups(prisma: PrismaClient) {
  let n = 0;
  for (const [code, spec] of Object.entries(TOMS_MOCKUP_SPECS)) {
    const slug = tomsSlug(code);
    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!product) {
      console.warn("TOMS mockup skip (no product):", code);
      continue;
    }
    await upsertMockupsForProduct(prisma, product.id, spec);
    await upsertGallery(prisma, product.id, spec);
    await prisma.product.update({
      where: { id: product.id },
      data: { thumbnailUrl: spec.front },
    });
    n++;
    console.log("TOMS mockup synced:", slug);
  }
  return n;
}
