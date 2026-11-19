export interface ProductCanvasConfig {
  width: number;
  height: number;
  backgroundColor: string;
  label: string;
}

/** 상품별 캔버스(인쇄 영역) 크기 — 추후 DB/Product 설정으로 이전 */
export const productCanvasConfigs: Record<string, ProductCanvasConfig> = {
  "prod-001": {
    width: 360,
    height: 440,
    backgroundColor: "#ffffff",
    label: "티셔츠 앞면",
  },
  "prod-002": {
    width: 400,
    height: 400,
    backgroundColor: "#f5f0e8",
    label: "반팔티 앞면",
  },
  "prod-003": {
    width: 280,
    height: 280,
    backgroundColor: "#ffffff",
    label: "머그컵 감싸기",
  },
};

export const defaultCanvasConfig: ProductCanvasConfig = {
  width: 400,
  height: 400,
  backgroundColor: "#ffffff",
  label: "기본 영역",
};

export function getProductCanvasConfig(productId: string): ProductCanvasConfig {
  return productCanvasConfigs[productId] ?? defaultCanvasConfig;
}
