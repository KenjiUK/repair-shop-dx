/**
 * カンバンボードユーティリティ
 * 作業指示・進捗管理画面用
 */

import { ZohoJob, JobStage, ServiceKind } from "@/types";
import { parseWorkOrdersFromZoho } from "@/lib/work-order-converter";

/**
 * カンバンボード列のタイプ
 */
export type KanbanColumnType = "waiting" | "working" | "inspection" | "completed";

/**
 * カンバンボード列の定義
 */
export interface KanbanColumn {
  id: KanbanColumnType;
  title: string;
  statuses: JobStage[];
}

/**
 * カンバンボード列の定義
 */
export const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: "waiting",
    title: "待機中",
    statuses: [
      "入庫待ち",
      "入庫済み",
      "見積作成待ち",
      "見積提示済み",
      "部品調達待ち",
      "部品発注待ち",
    ],
  },
  {
    id: "working",
    title: "作業中",
    statuses: ["作業待ち"],
  },
  {
    id: "inspection",
    title: "検査待ち",
    statuses: [], // WorkOrder.status === "完了" かつ ZohoJob.field5 === "作業待ち" で判定
  },
  {
    id: "completed",
    title: "完了",
    statuses: ["出庫待ち", "出庫済み"],
  },
];

/**
 * ジョブをカンバンボード列に分類
 */
export function categorizeJobToColumn(job: ZohoJob): KanbanColumnType {
  const status = job.field5;

  // 検査待ちの判定: WorkOrder.status === "完了" かつ ZohoJob.field5 === "作業待ち"
  if (status === "作業待ち") {
    const jobWithWorkOrders = job as ZohoJob & { field_work_orders?: string | null };
    const workOrders = parseWorkOrdersFromZoho(jobWithWorkOrders.field_work_orders);
    
    // すべてのワークオーダーが完了しているかチェック
    const allCompleted = workOrders.length > 0 && workOrders.every(
      (wo) => wo.status === "完了"
    );
    
    if (allCompleted) {
      return "inspection";
    }
  }

  // 通常のステータス判定
  for (const column of KANBAN_COLUMNS) {
    if (column.statuses.includes(status)) {
      return column.id;
    }
  }

  // デフォルトは待機中
  return "waiting";
}

/**
 * ジョブを列ごとに分類
 */
export function groupJobsByColumn(jobs: ZohoJob[]): Record<KanbanColumnType, ZohoJob[]> {
  const grouped: Record<KanbanColumnType, ZohoJob[]> = {
    waiting: [],
    working: [],
    inspection: [],
    completed: [],
  };

  jobs.forEach((job) => {
    const columnId = categorizeJobToColumn(job);
    grouped[columnId].push(job);
  });

  return grouped;
}

/**
 * ステータスから進捗率を計算
 */
export function calculateProgressFromStatus(status: JobStage): number {
  switch (status) {
    case "入庫待ち":
      return 0;
    case "入庫済み":
      return 15;
    case "見積作成待ち":
      return 30;
    case "見積提示済み":
      return 40;
    case "作業待ち":
      return 50;
    case "出庫待ち":
      return 90;
    case "出庫済み":
      return 100;
    default:
      return 0;
  }
}

/**
 * 作業内容のアイコンを取得（入庫区分から）
 */
export function getServiceKindIcon(serviceKind: ServiceKind | null | undefined): string {
  if (!serviceKind) return "⚙️";
  
  const iconMap: Record<string, string> = {
    車検: "🔍",
    "12ヵ月点検": "🔧",
    "修理・整備": "🔧",
    レストア: "🎨",
    チューニング: "⚡",
    コーティング: "✨",
    "エンジンオイル交換": "🛢️",
    "タイヤ交換・ローテーション": "🛞",
  };

  return iconMap[serviceKind] || "⚙️";
}

/**
 * 予定完了時刻を推定（入庫日時 + 平均作業時間）
 */
export function estimateCompletionTime(job: ZohoJob): Date | null {
  if (!job.field22) return null;

  const arrivalDate = new Date(job.field22);
  
  // デフォルト: 4時間後
  let estimatedHours = 4;
  
  // 入庫区分に応じて調整
  const serviceKind = job.serviceKind;
  if (serviceKind === "車検") {
    estimatedHours = 2;
  } else if (serviceKind === "レストア" || serviceKind === "板金・塗装") {
    estimatedHours = 24; // 長期プロジェクトは1日後
  } else if (serviceKind === "修理・整備") {
    estimatedHours = 6;
  }

  const estimatedCompletion = new Date(arrivalDate);
  estimatedCompletion.setHours(estimatedCompletion.getHours() + estimatedHours);

  return estimatedCompletion;
}

/**
 * 技術者稼働状況
 */
export interface MechanicWorkload {
  mechanicName: string;
  totalJobs: number;
  workingJobs: number;
  utilizationRate: number; // 稼働率（%）
  freeTime: number; // 空き時間（分）
}

/**
 * 技術者の稼働状況を計算
 */
export function calculateMechanicWorkload(
  jobs: ZohoJob[],
  mechanicName: string
): MechanicWorkload {
  // 技術者の担当案件をフィルタリング
  const mechanicJobs = jobs.filter(
    (job) => job.assignedMechanic === mechanicName
  );

  // 作業中の案件数
  const workingJobs = mechanicJobs.filter(
    (job) => job.field5 === "作業待ち"
  ).length;

  // 作業記録から作業時間を集計
  let totalWorkDuration = 0;
  mechanicJobs.forEach((job) => {
    const jobWithWorkOrders = job as ZohoJob & { field_work_orders?: string | null };
    const workOrders = parseWorkOrdersFromZoho(jobWithWorkOrders.field_work_orders);

    workOrders.forEach((wo) => {
      if (wo.work?.records) {
        wo.work.records.forEach((record) => {
          const duration = (record as any).duration;
          if (duration) {
            totalWorkDuration += duration;
          }
        });
      }
    });
  });

  // 1日あたりの総作業可能時間（8時間 = 480分）
  const totalAvailableTime = 8 * 60;
  
  // 稼働率を計算
  const utilizationRate = totalAvailableTime > 0
    ? Math.min((totalWorkDuration / totalAvailableTime) * 100, 100)
    : 0;

  // 空き時間を計算
  const freeTime = Math.max(0, totalAvailableTime - totalWorkDuration);

  return {
    mechanicName,
    totalJobs: mechanicJobs.length,
    workingJobs,
    utilizationRate: Math.round(utilizationRate * 10) / 10, // 小数点第1位まで
    freeTime: Math.round(freeTime),
  };
}

