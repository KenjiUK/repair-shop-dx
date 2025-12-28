/**
 * 業務分析ユーティリティ
 * 改善提案 #8: 業務分析機能の実装
 */

import { ZohoJob, ServiceKind } from "@/types";
import { parseWorkOrdersFromZoho } from "@/lib/work-order-converter";

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

// =============================================================================
// 売上分析機能
// =============================================================================

/**
 * 売上データポイント
 */
export interface RevenueDataPoint {
  date: string;
  revenue: number; // 売上金額（税込）
  count: number; // 案件数
}

/**
 * 作業区分別売上データポイント
 */
export interface ServiceKindRevenueDataPoint {
  serviceKind: string;
  revenue: number; // 売上金額（税込）
  count: number; // 案件数
}

/**
 * 技術者別生産性データポイント
 */
export interface MechanicProductivityDataPoint {
  mechanicName: string;
  jobCount: number; // 作業件数
  totalDuration: number; // 総作業時間（分）
  averageDuration: number; // 平均作業時間（分）
  revenue: number; // 売上金額（税込）
}

/**
 * 部品売上 vs 工賃売上データ
 */
export interface PartsVsLaborData {
  partsRevenue: number; // 部品売上
  laborRevenue: number; // 工賃売上
  totalRevenue: number; // 合計売上
}

/**
 * 売上分析データ
 */
export interface RevenueAnalyticsData {
  averagePrice: number; // 平均単価
  totalRevenue: number; // 総売上
  totalJobs: number; // 総案件数
  revenueTrend: RevenueDataPoint[]; // 日次・週次・月次売上トレンド
  serviceKindRevenue: ServiceKindRevenueDataPoint[]; // 作業区分別売上
  mechanicProductivity: MechanicProductivityDataPoint[]; // 技術者別生産性
  partsVsLabor: PartsVsLaborData; // 部品売上 vs 工賃売上
  recommendedApprovalRate: number; // 推奨作業承認率（%）
}

/**
 * 見積データから売上金額を計算
 */
function calculateEstimateRevenue(estimateItems: Array<{ price: number }>): number {
  return estimateItems.reduce((sum, item) => sum + (item.price || 0), 0);
}

/**
 * 見積データから部品代と工賃を分離計算
 * EstimateLineItemの情報があれば使用、なければ概算
 */
function calculatePartsVsLabor(
  estimateItems: Array<{
    price: number;
    partQuantity?: number;
    partUnitPrice?: number;
    laborCost?: number;
  }>
): PartsVsLaborData {
  let partsRevenue = 0;
  let laborRevenue = 0;

  estimateItems.forEach((item) => {
    // EstimateLineItemの情報があれば正確に計算
    if (
      item.partQuantity !== undefined &&
      item.partUnitPrice !== undefined &&
      item.laborCost !== undefined
    ) {
      partsRevenue += (item.partQuantity || 0) * (item.partUnitPrice || 0);
      laborRevenue += item.laborCost || 0;
    } else {
      // EstimateItemのみの場合は、priceを概算で分割（部品:工賃 = 6:4）
      const estimatedParts = item.price * 0.6;
      const estimatedLabor = item.price * 0.4;
      partsRevenue += estimatedParts;
      laborRevenue += estimatedLabor;
    }
  });

  return {
    partsRevenue,
    laborRevenue,
    totalRevenue: partsRevenue + laborRevenue,
  };
}

/**
 * 推奨作業承認率を計算
 */
function calculateRecommendedApprovalRate(
  jobs: ZohoJob[]
): number {
  let recommendedCount = 0;
  let approvedRecommendedCount = 0;

  jobs.forEach((job) => {
    // ワークオーダーから見積データを取得
    const jobWithWorkOrders = job as ZohoJob & { field_work_orders?: string | null };
    const workOrders = parseWorkOrdersFromZoho(jobWithWorkOrders.field_work_orders);

    workOrders.forEach((wo) => {
      if (!wo.estimate?.items) return;

      wo.estimate.items.forEach((item) => {
        // 推奨作業（priority === "recommended"）をカウント
        if (item.priority === "recommended") {
          recommendedCount++;
          // 承認済み（作業待ち以降）をカウント
          if (
            job.field5 === "作業待ち" ||
            job.field5 === "出庫待ち" ||
            job.field5 === "出庫済み"
          ) {
            approvedRecommendedCount++;
          }
        }
      });
    });
  });

  if (recommendedCount === 0) return 0;
  return (approvedRecommendedCount / recommendedCount) * 100;
}

/**
 * 売上分析データを生成
 */
export function generateRevenueAnalyticsData(
  jobs: ZohoJob[],
  dateRange: "week" | "month" | "quarter" | "year",
  startDate: Date,
  endDate: Date
): RevenueAnalyticsData {
  // 期間内のジョブをフィルタリング
  const filteredJobs = getJobsInDateRange(jobs, startDate, endDate);

  // 全売上を集計
  let totalRevenue = 0;
  let totalPartsRevenue = 0;
  let totalLaborRevenue = 0;
  const allEstimateItems: Array<{
    price: number;
    partQuantity?: number;
    partUnitPrice?: number;
    laborCost?: number;
  }> = [];

  filteredJobs.forEach((job) => {
    // ワークオーダーから見積データを取得
    const jobWithWorkOrders = job as ZohoJob & { field_work_orders?: string | null };
    const workOrders = parseWorkOrdersFromZoho(jobWithWorkOrders.field_work_orders);

    workOrders.forEach((wo) => {
      if (!wo.estimate?.items) return;

      wo.estimate.items.forEach((item) => {
        totalRevenue += item.price || 0;
        allEstimateItems.push({
          price: item.price || 0,
          partQuantity: (item as { partQuantity?: number }).partQuantity,
          partUnitPrice: (item as { partUnitPrice?: number }).partUnitPrice,
          laborCost: (item as { laborCost?: number }).laborCost,
        });
      });
    });
  });

  // 部品売上 vs 工賃売上を計算
  const partsVsLabor = calculatePartsVsLabor(allEstimateItems);
  totalPartsRevenue = partsVsLabor.partsRevenue;
  totalLaborRevenue = partsVsLabor.laborRevenue;

  // 平均単価を計算
  const totalJobs = filteredJobs.length;
  const averagePrice = totalJobs > 0 ? totalRevenue / totalJobs : 0;

  // 日別の売上を集計
  const dateGroups = groupByDate(filteredJobs, dateRange);
  const revenueTrend: RevenueDataPoint[] = dateGroups.map((group) => {
    let groupRevenue = 0;

    group.jobs.forEach((job) => {
      const jobWithWorkOrders = job as ZohoJob & { field_work_orders?: string | null };
      const workOrders = parseWorkOrdersFromZoho(jobWithWorkOrders.field_work_orders);

      workOrders.forEach((wo) => {
        if (!wo.estimate?.items) return;
        groupRevenue += calculateEstimateRevenue(wo.estimate.items);
      });
    });

    return {
      date: group.date,
      revenue: groupRevenue,
      count: group.jobs.length,
    };
  });

  // 作業区分別の売上を集計
  const serviceKindGroups = groupByServiceKind(filteredJobs);
  const serviceKindRevenue: ServiceKindRevenueDataPoint[] = serviceKindGroups.map((group) => {
    let groupRevenue = 0;

    group.jobs.forEach((job) => {
      const jobWithWorkOrders = job as ZohoJob & { field_work_orders?: string | null };
      const workOrders = parseWorkOrdersFromZoho(jobWithWorkOrders.field_work_orders);

      workOrders.forEach((wo) => {
        if (!wo.estimate?.items) return;
        groupRevenue += calculateEstimateRevenue(wo.estimate.items);
      });
    });

    return {
      serviceKind: group.serviceKind,
      revenue: groupRevenue,
      count: group.jobs.length,
    };
  });

  // 技術者別生産性を集計
  const mechanicMap = new Map<string, {
    jobCount: number;
    totalDuration: number;
    revenue: number;
  }>();

  filteredJobs.forEach((job) => {
    // ワークオーダーから作業データを取得
    const jobWithWorkOrders = job as ZohoJob & { field_work_orders?: string | null };
    const workOrders = parseWorkOrdersFromZoho(jobWithWorkOrders.field_work_orders);

    workOrders.forEach((wo) => {
      const mechanicName = wo.work?.mechanicName || wo.work?.records?.[0]?.mechanicName;
      if (!mechanicName) return;

      const jobRevenue = wo.estimate?.items
        ? calculateEstimateRevenue(wo.estimate.items)
        : 0;

      const totalDuration = wo.work?.records?.reduce(
        (sum, record) => sum + ((record as any).duration || 0),
        0
      ) || 0;

      if (!mechanicMap.has(mechanicName)) {
        mechanicMap.set(mechanicName, {
          jobCount: 0,
          totalDuration: 0,
          revenue: 0,
        });
      }

      const mechanicData = mechanicMap.get(mechanicName)!;
      mechanicData.jobCount += 1;
      mechanicData.totalDuration += totalDuration;
      mechanicData.revenue += jobRevenue;
    });
  });

  const mechanicProductivity: MechanicProductivityDataPoint[] = Array.from(
    mechanicMap.entries()
  ).map(([mechanicName, data]) => ({
    mechanicName,
    jobCount: data.jobCount,
    totalDuration: data.totalDuration,
    averageDuration: data.jobCount > 0 ? data.totalDuration / data.jobCount : 0,
    revenue: data.revenue,
  }));

  // 推奨作業承認率を計算
  const recommendedApprovalRate = calculateRecommendedApprovalRate(filteredJobs);

  return {
    averagePrice,
    totalRevenue,
    totalJobs,
    revenueTrend,
    serviceKindRevenue,
    mechanicProductivity,
    partsVsLabor: {
      partsRevenue: totalPartsRevenue,
      laborRevenue: totalLaborRevenue,
      totalRevenue: totalPartsRevenue + totalLaborRevenue,
    },
    recommendedApprovalRate,
  };
}

// =============================================================================
// 顧客分析機能
// =============================================================================

/**
 * 顧客分析データ
 */
export interface CustomerAnalyticsData {
  repeatRate: number; // リピート率（%）
  totalCustomers: number; // 総顧客数
  repeatCustomers: number; // リピート顧客数
  newCustomers: number; // 新規顧客数
  averageJobsPerCustomer: number; // 顧客あたりの平均案件数
}

/**
 * 顧客分析データを生成
 */
export function generateCustomerAnalyticsData(
  jobs: ZohoJob[],
  startDate: Date,
  endDate: Date
): CustomerAnalyticsData {
  // 期間内のジョブをフィルタリング
  const filteredJobs = getJobsInDateRange(jobs, startDate, endDate);

  // 顧客IDごとの案件数を集計
  const customerJobMap = new Map<string, number>();
  filteredJobs.forEach((job) => {
    const customerId = job.field4?.id;
    if (!customerId) return;

    const currentCount = customerJobMap.get(customerId) || 0;
    customerJobMap.set(customerId, currentCount + 1);
  });

  // 全期間のジョブから顧客の過去の案件数を確認
  const allCustomerJobMap = new Map<string, number>();
  jobs.forEach((job) => {
    const customerId = job.field4?.id;
    if (!customerId) return;

    const currentCount = allCustomerJobMap.get(customerId) || 0;
    allCustomerJobMap.set(customerId, currentCount + 1);
  });

  // リピート顧客（過去に1件以上、期間内に1件以上）をカウント
  let repeatCustomers = 0;
  let newCustomers = 0;
  const periodCustomerIds = new Set(filteredJobs.map((job) => job.field4?.id).filter(Boolean));

  periodCustomerIds.forEach((customerId) => {
    if (!customerId) return;
    const totalJobs = allCustomerJobMap.get(customerId) || 0;
    const periodJobs = customerJobMap.get(customerId) || 0;

    // 期間内の案件数が1件で、全期間の案件数が2件以上ならリピート顧客
    if (periodJobs >= 1 && totalJobs >= 2) {
      repeatCustomers++;
    } else if (periodJobs >= 1 && totalJobs === 1) {
      // 期間内の案件数が1件で、全期間の案件数が1件なら新規顧客
      newCustomers++;
    }
  });

  const totalCustomers = periodCustomerIds.size;
  const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

  // 顧客あたりの平均案件数
  const totalJobCount = filteredJobs.length;
  const averageJobsPerCustomer = totalCustomers > 0 ? totalJobCount / totalCustomers : 0;

  return {
    repeatRate,
    totalCustomers,
    repeatCustomers,
    newCustomers,
    averageJobsPerCustomer,
  };
}

// =============================================================================
// 業務効率分析機能
// =============================================================================

/**
 * 工程別ボトルネックデータポイント
 */
export interface PhaseBottleneckDataPoint {
  phase: string; // 工程名
  averageDuration: number; // 平均滞留時間（時間）
  jobCount: number; // 案件数
  maxDuration: number; // 最大滞留時間（時間）
  minDuration: number; // 最小滞留時間（時間）
}

/**
 * 業務効率分析データ
 */
export interface EfficiencyAnalyticsData {
  averageWorkDuration: number; // 平均作業時間（分）
  totalWorkDuration: number; // 総作業時間（分）
  totalWorkRecords: number; // 総作業記録数
  phaseBottlenecks: PhaseBottleneckDataPoint[]; // 工程別ボトルネック
}

/**
 * 工程の滞留時間を計算
 */
function calculatePhaseDuration(
  jobs: ZohoJob[],
  phase: string
): {
  durations: number[];
  jobCount: number;
} {
  const durations: number[] = [];
  let jobCount = 0;

  jobs.forEach((job) => {
    // 該当工程のジョブをフィルタリング
    if (job.field5 !== phase) return;

    // 入庫日時と現在の工程開始日時から滞留時間を計算
    const arrivalDate = job.field22 ? new Date(job.field22) : null;
    if (!arrivalDate) return;

    // 工程の開始日時を推定（実際の実装では、工程変更履歴が必要）
    // ここでは簡易的に入庫日時から現在までの時間を計算
    const now = new Date();
    const durationHours = (now.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60);

    if (durationHours > 0) {
      durations.push(durationHours);
      jobCount++;
    }
  });

  return { durations, jobCount };
}

/**
 * 業務効率分析データを生成
 */
export function generateEfficiencyAnalyticsData(
  jobs: ZohoJob[],
  startDate: Date,
  endDate: Date
): EfficiencyAnalyticsData {
  // 期間内のジョブをフィルタリング
  const filteredJobs = getJobsInDateRange(jobs, startDate, endDate);

  // 作業記録から作業時間を集計
  let totalWorkDuration = 0;
  let totalWorkRecords = 0;

  filteredJobs.forEach((job) => {
    const jobWithWorkOrders = job as ZohoJob & { field_work_orders?: string | null };
    const workOrders = parseWorkOrdersFromZoho(jobWithWorkOrders.field_work_orders);

    workOrders.forEach((wo) => {
      if (!wo.work?.records) return;

      wo.work.records.forEach((record) => {
        const duration = (record as any).duration;
        if (duration) {
          totalWorkDuration += duration;
          totalWorkRecords++;
        }
      });
    });
  });

  const averageWorkDuration = totalWorkRecords > 0 ? totalWorkDuration / totalWorkRecords : 0;

  // 工程別ボトルネックを分析
  const phases = [
    "入庫待ち",
    "入庫済み",
    "診断待ち",
    "見積作成待ち",
    "お客様承認待ち",
    "作業待ち",
    "部品調達待ち",
    "部品発注待ち",
    "出庫待ち",
  ];

  const phaseBottlenecks: PhaseBottleneckDataPoint[] = phases
    .map((phase) => {
      const { durations, jobCount } = calculatePhaseDuration(filteredJobs, phase);

      if (jobCount === 0) return null;

      const averageDuration =
        durations.length > 0
          ? durations.reduce((sum, d) => sum + d, 0) / durations.length
          : 0;
      const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;
      const minDuration = durations.length > 0 ? Math.min(...durations) : 0;

      return {
        phase,
        averageDuration,
        jobCount,
        maxDuration,
        minDuration,
      };
    })
    .filter((item): item is PhaseBottleneckDataPoint => item !== null)
    .sort((a, b) => b.averageDuration - a.averageDuration); // 平均滞留時間の降順

  return {
    averageWorkDuration,
    totalWorkDuration,
    totalWorkRecords,
    phaseBottlenecks,
  };
}