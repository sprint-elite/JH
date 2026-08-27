import type {
  BuilderOptions,
  DesignState,
  WorkOrderData,
  WorkOrderProcess,
} from "@/types/builder";
import {
  FABRIC_LABELS,
  HANDLE_LABELS,
  POCKET_LABELS,
  PRINT_SIDE_LABELS,
  PRODUCT_TYPE_LABELS,
  SIZE_LABELS,
} from "@/types/builder";

function buildProcesses(options: BuilderOptions): WorkOrderProcess[] {
  const fabric = FABRIC_LABELS[options.fabric];
  const handle = HANDLE_LABELS[options.handle];
  const pocket = POCKET_LABELS[options.pocket];
  const print = PRINT_SIDE_LABELS[options.printSide];
  const size = SIZE_LABELS[options.size];

  return [
    {
      name: "재단",
      instruction: `${size} 규격, ${fabric} 원단 기준 패널 재단 및 포켓 부자재 준비`,
    },
    {
      name: "인쇄",
      instruction: `${print} 인쇄면에 맞춰 면별 디자인 데이터 적용 (로고/문구 위치 확인)`,
    },
    {
      name: "봉제",
      instruction: `${handle} 장착, ${pocket} 옵션 반영 봉제 및 마감`,
    },
    {
      name: "검수",
      instruction: "인쇄 위치·색상·봉제 상태·오염 여부 최종 검수",
    },
    {
      name: "출고",
      instruction: `수량 ${options.quantity}개 확인 후 개별 포장 및 출고`,
    },
  ];
}

export function generateWorkOrder(
  orderNo: string,
  options: BuilderOptions,
  designData: DesignState,
): WorkOrderData {
  return {
    orderNo,
    productType: options.productType,
    options,
    quantity: options.quantity,
    designData,
    processes: buildProcesses(options),
    generatedAt: new Date().toISOString(),
  };
}
