/**
 * THE PRINTABLE WEAR 2026 COLLECTION (2026SS단가표.pdf)
 * 품목 41종 — VAT별도 S~XL(또는 대표 사이즈) 기준 단가
 */
export type TomsPdfSection = {
  slug: string;
  name: string;
  sortOrder: number;
};

/** 단가표 빨간 띠 섹션(01~05) — 최상위 카테고리 */
export const TOMS_PDF_SECTIONS: TomsPdfSection[] = [
  { slug: "01-tshirts", name: "티셔츠", sortOrder: 0 },
  { slug: "02-dry-mesh", name: "드라이메쉬·인터록", sortOrder: 1 },
  { slug: "03-polo", name: "폴로셔츠", sortOrder: 2 },
  { slug: "04-sweat", name: "스웨트", sortOrder: 3 },
  { slug: "05-others", name: "기타", sortOrder: 4 },
];

export type TomsCatalogItem = {
  sortOrder: number;
  code: string;
  name: string;
  /** PDF 판매가 (VAT 별도, 원) */
  priceExVat: number;
  cat: string;
};

function item(
  sortOrder: number,
  code: string,
  name: string,
  priceExVat: number,
  cat: string,
): TomsCatalogItem {
  return { sortOrder, code, name, priceExVat, cat };
}

/** PDF 섹션 순 + 품번 (085-CVT·095-CVE는 동일 품목 1종) */
export const TOMS_2026SS: TomsCatalogItem[] = [
  // 01 T-SHIRTS / 티셔츠
  item(1, "087-OET", "하이 그레이드 리브 바인딩 티셔츠", 3900, "01-tshirts"),
  item(2, "085-CVT", "베이직 라운드 티셔츠 (085-CVT/095-CVE)", 4400, "01-tshirts"),
  item(3, "086-DMT", "스탠다드 라운드 티셔츠", 3500, "01-tshirts"),
  item(4, "148-HVT", "헤비 라운드 티셔츠", 5100, "01-tshirts"),
  item(5, "113-BCV", "오버핏 라운드 티셔츠", 4500, "01-tshirts"),
  item(6, "109-PCT", "베이직 라운드 포켓 티셔츠", 4100, "01-tshirts"),
  item(7, "083-BBT", "라이트 라운드 티셔츠", 4600, "01-tshirts"),
  item(8, "102-CVL", "베이직 라운드 긴팔 티셔츠", 2900, "01-tshirts"),
  item(9, "110-CLL", "베이직 라운드 긴팔 티셔츠 (시보리)", 3300, "01-tshirts"),
  item(10, "149-HVL", "헤비 라운드 긴팔 티셔츠 (시보리)", 5300, "01-tshirts"),
  // 02 DRY MESH & INER LOCK
  item(11, "300-ACT", "드라이 라운드 티셔츠", 4800, "02-dry-mesh"),
  item(12, "350-AIT", "라이트 드라이 라운드 티셔츠", 5100, "02-dry-mesh"),
  item(13, "353-AIN", "라이트 드라이 민소매 티셔츠", 5600, "02-dry-mesh"),
  item(14, "304-ALT", "드라이 라운드 긴팔 티셔츠", 5700, "02-dry-mesh"),
  item(15, "321-ACR", "드라이 롱 팬츠", 5600, "02-dry-mesh"),
  item(16, "325-ACP", "드라이 하프 팬츠", 6800, "02-dry-mesh"),
  item(17, "338-AMZ", "드라이 후드 집업", 6000, "02-dry-mesh"),
  // 03 POLO-SHIRTS
  item(18, "302-ADP", "드라이 폴로셔츠", 4800, "03-polo"),
  item(19, "330-AVP", "드라이 폴로셔츠 (주머니)", 5100, "03-polo"),
  item(20, "313-ABN", "드라이 버튼다운 폴로셔츠", 5600, "03-polo"),
  item(21, "339-AYP", "드라이 레이어드 폴로셔츠 (주머니)", 5700, "03-polo"),
  item(22, "141-NVP", "T/C 폴로셔츠", 6800, "03-polo"),
  item(23, "335-ALP", "드라이 긴팔 폴로셔츠 (주머니)", 6000, "03-polo"),
  // 04 SWEAT
  item(24, "210-NAC", "T/C 쮸리 맨투맨", 8800, "04-sweat"),
  item(25, "207-NAH", "T/C 쮸리 후드티", 9500, "04-sweat"),
  item(26, "208-NAZ", "T/C 쮸리 후드 집업", 11500, "04-sweat"),
  item(27, "271-BFC", "T/C 기모 맨투맨", 15800, "04-sweat"),
  item(28, "272-BFH", "T/C 기모 후드티", 10000, "04-sweat"),
  item(29, "273-BFZ", "T/C 기모 후드 집업", 13900, "04-sweat"),
  item(30, "219-MLC", "코튼 쮸리 맨투맨", 9400, "04-sweat"),
  item(31, "216-MLH", "코튼 쮸리 후드티", 9900, "04-sweat"),
  item(32, "217-MLZ", "코튼 쮸리 후드 집업", 12200, "04-sweat"),
  item(33, "218-MLP", "코튼 쮸리 팬츠", 12600, "04-sweat"),
  item(34, "220-MHP", "코튼 쮸리 하프 팬츠", 14800, "04-sweat"),
  item(35, "183-NSC", "헤비 쮸리 맨투맨", 15300, "04-sweat"),
  item(36, "188-NNH", "헤비 쮸리 후드티", 11500, "04-sweat"),
  item(37, "189-NNZ", "헤비 쮸리 후드 집업", 8300, "04-sweat"),
  // 05 OTHERS
  item(38, "238-RFJ", "리플렉트 플리스 자켓", 9500, "05-others"),
  item(39, "731-CCK", "코튼 트윌 볼캡", 4000, "05-others"),
  item(40, "778-TCC", "캔버스 에코백", 2300, "05-others"),
  item(41, "780-TWT", "투톤 에코백", 2800, "05-others"),
];

export function tomsSlug(code: string): string {
  return `toms-${code.toLowerCase().replace(/\s+/g, "")}`;
}

export function displayName(item: TomsCatalogItem): string {
  return `[${item.code}] ${item.name}`;
}

/** 쇼핑몰 노출 단가 (PDF VAT별도 + 10%) */
export function retailPrice(exVat: number): number {
  return Math.round(exVat * 1.1);
}

/** 단가표 섹션 → 빌더 캔버스(목업 폴백) */
export function tomsBuilderType(catSlug: string): string {
  switch (catSlug) {
    case "03-polo":
      return "shopping-bag";
    case "04-sweat":
      return "pouch";
    default:
      return "ecobag";
  }
}

/** 메인 홈 「2분컷」 카드 — 목업(front) 등록된 01 티셔츠 3종만 */
export const HOME_TWO_MINUTE_SCENES: Array<{
  code: string;
  title: string;
  description: string;
}> = [
  {
    code: "085-CVT",
    title: "동아리·행사 첫 단체티, 베이직 라운드",
    description:
      "085-CVT(17수). 로고·슬로건만 정하면 가장 무난한 단체 반팔티가 됩니다.",
  },
  {
    code: "087-OET",
    title: "리브 바인딩, 깔끔한 학과·축제티",
    description:
      "087-OET OE 16수. 목 라인이 단단하고 트렌디한 핏으로 단체 반팔티에 잘 어울립니다.",
  },
  {
    code: "148-HVT",
    title: "두꺼운 원단, 선명한 나염용 헤비티",
    description:
      "148-HVT 헤비 라운드. 로고·큰 슬로건 나염에 여유 있는 두께감을 원할 때 추천합니다.",
  },
];

/** 메인 「구매 후기」 샘플 — TOMS 품번 연결 */
export const HOME_REVIEW_SAMPLES: Array<{
  code: string;
  rating: number;
  content: string;
  isHot: boolean;
  authorName: string;
  daysAgo: number;
}> = [
  {
    code: "085-CVT",
    rating: 5,
    isHot: true,
    authorName: "김민수",
    daysAgo: 2,
    content:
      "동아리 단체티 120장 085-CVT로 맞췄는데 가슴 로고 선명하고 납기도 지켜주셨어요. 다음 행사도 같은 품번으로 갈 예정입니다.",
  },
  {
    code: "087-OET",
    rating: 5,
    isHot: false,
    authorName: "박서연",
    daysAgo: 5,
    content:
      "087-OET 리브 라인이 깔끔해서 학과 축제용으로 만족스러웠습니다. 밝은색 원단도 무난하게 나왔어요.",
  },
  {
    code: "300-ACT",
    rating: 5,
    isHot: true,
    authorName: "이준호",
    daysAgo: 8,
    content:
      "여름 체육대회용 300-ACT 80장 주문. 땀 많은 날씨에도 드라이 원단이라 현장 반응이 좋았습니다.",
  },
  {
    code: "302-ADP",
    rating: 5,
    isHot: true,
    authorName: "정하늘",
    daysAgo: 12,
    content:
      "카페 스태프 폴로 302-ADP 35장. 카라 나염 위치 맞춰 달라고 했는데 샘플 확인 후 바로 양산까지 수월했어요.",
  },
  {
    code: "141-NVP",
    rating: 4,
    isHot: false,
    authorName: "최유진",
    daysAgo: 18,
    content:
      "T/C 폴로 141-NVP로 교회 봉사팀 유니폼 맞췄습니다. 단가 대비 품질 괜찮고 재주문 검토 중이에요.",
  },
  {
    code: "210-NAC",
    rating: 5,
    isHot: true,
    authorName: "한지우",
    daysAgo: 24,
    content:
      "210-NAC 맨투맨 50장 MT용. 등판 슬로건 크기 조절해 주셔서 사진 찍기 좋게 나왔습니다.",
  },
  {
    code: "216-MLH",
    rating: 5,
    isHot: false,
    authorName: "오민재",
    daysAgo: 31,
    content:
      "216-MLH 후드 30장 졸업 기념용. 오트밀 색상 실물이 단가표랑 비슷하게 와서 만족합니다.",
  },
  {
    code: "778-TCC",
    rating: 5,
    isHot: true,
    authorName: "윤서아",
    daysAgo: 45,
    content:
      "행사 굿즈 778-TCC 에코백 M사이즈 200개. 로고 한 가지로 통일했는데 인쇄 흐림 없이 깔끔했어요.",
  },
];
