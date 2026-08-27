/**
 * WebSocket placeholder
 *
 * 추후 실시간 주문 상태 알림, 제작 진행 상황 브로드캐스트에 사용.
 * 서버: ws / Socket.io / Pusher 등 선택 후 연결.
 */

export type WebSocketEvent =
  | { type: "ORDER_STATUS_CHANGED"; orderId: string; status: string }
  | { type: "DESIGN_SAVED"; designId: string };

export function createWebSocketClient(_url?: string): WebSocket | null {
  // TODO: 클라이언트 WebSocket 인스턴스 생성
  if (typeof window === "undefined") return null;
  console.info("[websocket] placeholder — 연결 미구현");
  return null;
}

export function subscribeToOrders(
  _callback: (event: WebSocketEvent) => void,
): () => void {
  // TODO: 주문 이벤트 구독, cleanup 함수 반환
  return () => {};
}
