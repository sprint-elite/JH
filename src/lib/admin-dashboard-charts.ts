import type {
  MesMonthlyLeadTimePoint,
  MesMonthlyReworkPoint,
} from "@/lib/admin-dashboard";

export const MES_CHART_MONTHS = 6;

function monthKeyFromDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function lastMonths(count: number) {
  const now = new Date();
  const rows: { monthKey: string; label: string }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    rows.push({
      monthKey: monthKeyFromDate(start),
      label: start.toLocaleDateString("ko-KR", { month: "short" }),
    });
  }
  return rows;
}

/** 차트 x축: 최근 N개월 슬롯(데이터 없어도 0으로 채움) */
export function normalizeMesReworkMonthly(
  points: MesMonthlyReworkPoint[] | undefined,
): MesMonthlyReworkPoint[] {
  return lastMonths(MES_CHART_MONTHS).map((m) => {
    const hit = points?.find((p) => p.monthKey === m.monthKey);
    return {
      monthKey: m.monthKey,
      label: m.label,
      totalWorkOrders: hit?.totalWorkOrders ?? 0,
      commentWorkOrders: hit?.commentWorkOrders ?? 0,
    };
  });
}

export function normalizeMesLeadTimeMonthly(
  points: MesMonthlyLeadTimePoint[] | undefined,
): MesMonthlyLeadTimePoint[] {
  return lastMonths(MES_CHART_MONTHS).map((m) => {
    const hit = points?.find((p) => p.monthKey === m.monthKey);
    return {
      monthKey: m.monthKey,
      label: m.label,
      avgLeadTimeHours: hit?.avgLeadTimeHours ?? 0,
      sampleCount: hit?.sampleCount ?? 0,
    };
  });
}
