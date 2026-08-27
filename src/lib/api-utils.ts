import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(err: unknown) {
  if (err instanceof AuthError) {
    return jsonError(err.message, err.status);
  }
  if (
    err instanceof Error &&
    "status" in err &&
    typeof (err as Error & { status?: number }).status === "number"
  ) {
    const status = (err as Error & { status: number }).status;
    if (status >= 400 && status < 600) {
      return jsonError(err.message, status);
    }
  }
  console.error(err);
  return jsonError("서버 오류가 발생했습니다.", 500);
}
