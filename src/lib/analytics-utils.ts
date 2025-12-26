/**
 * 業務分析ユーティリティ
 * 改善提案 #8: 業務分析機能の実装
 */

import { ZohoJob, ServiceKind } from "@/types";

/**
 * トレンドデータポイント
 */
export interface TrendDataPoint {
  date: string;
  count: number;
  inProgress: number;
  completed: number;
}

/**
 * 入庫区分別データポイント
 */
export interface ServiceKindDataPoint {
  serviceKind: string;
  count: number;
}

/**
 * 繁忙期・閑散期データ
 */
export interface BusyVsQuietData {
  average: number;
  busyPeriods: Array<{ week: string; count: number }>;
  quietPeriods: Array<{ week: string; count: number }>;
  weeklyData: Array<{ week: string; count: number }>;
}

/**
 * 分析データ
 */
export interface AnalyticsData {
  trendData: TrendDataPoint[];
  serviceKindData: ServiceKindDataPoint[];
  busyVsQuietData: BusyVsQuietData;
}

/**
 * 日付範囲内のジョブを取得
 */
export function getJobsInDateRange(
  jobs: ZohoJob[],
  startDate: Date,
  endDate: Date
): ZohoJob[] {
  return jobs.filter((job) => {
    const jobDate = job.field22 ? new Date(job.field22) : null;
    if (!jobDate) return false;
    return jobDate >= startDate && jobDate <= endDate;
  });
}

/**
 * 日付でグループ化
 */
export function groupByDate(
  jobs: ZohoJob[],
  dateRange: "week" | "month" | "quarter" | "year"
): Array<{ date: string; jobs: ZohoJob[] }> {
  const groups: Map<string, ZohoJob[]> = new Map();

  jobs.forEach((job) => {
    if (!job.field22) return;
    const jobDate = new Date(job.field22);
    let key: string;

    switch (dateRange) {
      case "week":
        key = jobDate.toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
        break;
      case "month":
        key = jobDate.toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "2-digit",
        });
        break;
      case "quarter":
        const quarter = Math.floor(jobDate.getMonth() / 3) + 1;
        key = `${jobDate.getFullYear()}Q${quarter}`;
        break;
      case "year":
        key = jobDate.getFullYear().toString();
        break;
      default:
        key = jobDate.toLocaleDateString("ja-JP");
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(job);
  });

  return Array.from(groups.entries())
    .map(([date, jobs]) => ({ date, jobs }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 入庫区分でグループ化
 */
export function groupByServiceKind(
  jobs: ZohoJob[]
): Array<{ serviceKind: string; jobs: ZohoJob[] }> {
  const groups: Map<string, ZohoJob[]> = new Map();

  jobs.forEach((job) => {
    const serviceKinds =
      job.field_service_kinds || (job.serviceKind ? [job.serviceKind] : []);
    if (serviceKinds.length === 0) {
      const other = "その他";
      if (!groups.has(other)) {
        groups.set(other, []);
      }
      groups.get(other)!.push(job);
    } else {
      serviceKinds.forEach((kind) => {
        const kindStr = kind as string;
        if (!groups.has(kindStr)) {
          groups.set(kindStr, []);
        }
        groups.get(kindStr)!.push(job);
      });
    }
  });

  return Array.from(groups.entries()).map(([serviceKind, jobs]) => ({
    serviceKind,
    jobs,
  }));
}

/**
 * 週の範囲を取得
 */
function getWeeksInRange(startDate: Date, endDate: Date): Array<{
  start: Date;
  end: Date;
}> {
  const weeks: Array<{ start: Date; end: Date }> = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const weekStart = new Date(current);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // 週の開始（日曜日）

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // 週の終了（土曜日）

    weeks.push({ start: weekStart, end: weekEnd });
    current.setDate(current.getDate() + 7);
  }

  return weeks;
}

/**
 * 週をフォーマット
 */
function formatWeek(date: Date): string {
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * 繁忙期・閑散期の比較
 */
export function compareBusyAndQuietPeriods(
  jobs: ZohoJob[],
  startDate: Date,
  endDate: Date
): BusyVsQuietData {
  const weeks = getWeeksInRange(startDate, endDate);

  const weeklyData = weeks.map((week) => ({
    week: formatWeek(week.start),
    count: jobs.filter((job) => {
      if (!job.field22) return false;
      const jobDate = new Date(job.field22);
      return jobDate >= week.start && jobDate <= week.end;
    }).length,
  }));

  const average =
    weeklyData.reduce((sum, week) => sum + week.count, 0) /
    weeklyData.length;

  const busyPeriods = weeklyData.filter(
    (week) => week.count > average * 1.2
  );
  const quietPeriods = weeklyData.filter((week) => week.count < average * 0.8);

  return {
    average,
    busyPeriods,
    quietPeriods,
    weeklyData,
  };
}

/**
 * 分析データを生成
 */
export function generateAnalyticsData(
  jobs: ZohoJob[],
  dateRange: "week" | "month" | "quarter" | "year",
  startDate: Date,
  endDate: Date
): AnalyticsData {
  // 期間内のジョブをフィルタリング
  const filteredJobs = getJobsInDateRange(jobs, startDate, endDate);

  // 日別の業務量を集計
  const dateGroups = groupByDate(filteredJobs, dateRange);
  const trendData: TrendDataPoint[] = dateGroups.map((group) => ({
    date: group.date,
    count: group.jobs.length,
    inProgress: group.jobs.filter(
      (j) => j.field5 !== "出庫待ち" && j.field5 !== "出庫済み"
    ).length,
    completed: group.jobs.filter(
      (j) => j.field5 === "出庫待ち" || j.field5 === "出庫済み"
    ).length,
  }));

  // 入庫区分別の業務量を集計
  const serviceKindGroups = groupByServiceKind(filteredJobs);
  const serviceKindData: ServiceKindDataPoint[] = serviceKindGroups.map(
    (group) => ({
      serviceKind: group.serviceKind,
      count: group.jobs.length,
    })
  );

  // 繁忙期・閑散期の比較
  const busyVsQuietData = compareBusyAndQuietPeriods(
    filteredJobs,
    startDate,
    endDate
  );

  return {
    trendData,
    serviceKindData,
    busyVsQuietData,
  };
}

/**
 * 月の開始日を取得
 */
export function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * 月の終了日を取得
 */
export function getEndOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * 週の開始日を取得
 */
export function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

/**
 * 週の終了日を取得
 */
export function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date);
  return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
}
